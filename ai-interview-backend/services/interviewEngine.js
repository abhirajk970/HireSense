/**
 * interviewEngine.js — 7-State Interview State Machine
 *
 * States (from ai-interviewPlan.txt):
 *   INIT → QUESTION_GIVEN → INTUITION_EXPLAINED → INTUITION_APPROVED
 *        → CODE_WRITTEN → CODE_EVALUATED → CODE_EXPLAINED
 *        → FOLLOW_UP → FINAL_FEEDBACK
 *
 * This engine drives transitions and decides what to ask next.
 * It does NOT own LLM or scoring — it orchestrates them.
 */

const llm          = require("./llmService");
const { runCode }  = require("./codeRunner");
const { computeScore, verdictToScore, buildFeedbackSummary } = require("./scoringService");
const AIInterview  = require("../models/AIInterview");
const DSAQuestion  = require("../models/DSAQuestion");

// ─── State transition rules ───────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  INIT:                 ["QUESTION_GIVEN"],
  QUESTION_GIVEN:       ["INTUITION_EXPLAINED"],
  INTUITION_EXPLAINED:  ["INTUITION_APPROVED", "QUESTION_GIVEN"],  // retry if wrong
  INTUITION_APPROVED:   ["CODE_WRITTEN"],
  CODE_WRITTEN:         ["CODE_EVALUATED"],
  CODE_EVALUATED:       ["CODE_EXPLAINED"],
  CODE_EXPLAINED:       ["FOLLOW_UP"],
  FOLLOW_UP:            ["FINAL_FEEDBACK"],
  FINAL_FEEDBACK:       []  // terminal
};

function canTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Pick a question for the session ─────────────────────────────────────────

async function pickQuestion() {
  const count  = await DSAQuestion.countDocuments({ isActive: true });
  if (count === 0) return null;
  const skip   = Math.floor(Math.random() * count);
  return await DSAQuestion.findOne({ isActive: true }).skip(skip);
}

// ─── Start interview — INIT → QUESTION_GIVEN ─────────────────────────────────

/**
 * Initialize DSA interview flow.
 * Picks a question, stores it, emits question text.
 * @returns {Promise<{message: string, state: string, question: object}>}
 */
async function startDSAInterview(roomId) {
  let interview = await AIInterview.findOne({ roomId });
  if (!interview) {
    interview = await AIInterview.create({
      roomId, status: "InProgress", startedAt: new Date(), interviewState: "INIT"
    });
  }

  const question = await pickQuestion();
  if (!question) {
    return {
      message: "No questions available in the question bank. Please seed the database.",
      state: "INIT",
      question: null
    };
  }

  interview.interviewState    = "QUESTION_GIVEN";
  interview.questionId        = question._id;
  interview.currentQuestionIndex = 0;
  interview.hintLevel         = 0;
  interview.hintPenalty       = 0;
  await interview.save();

  const message = `Here's your DSA problem:\n\n**${question.title}** (${question.difficulty})\n\n${question.description}\n\nTake a moment to read it. When you're ready, explain your approach — how would you think about solving this?`;

  return { message, state: "QUESTION_GIVEN", question: { title: question.title, difficulty: question.difficulty, id: question._id } };
}

// ─── Submit intuition — QUESTION_GIVEN → INTUITION_EXPLAINED/APPROVED ────────

/**
 * Evaluate candidate's intuition/approach.
 * @returns {Promise<{message, state, verdict}>}
 */
async function submitIntuition(roomId, intuitionText) {
  const interview = await AIInterview.findOne({ roomId });
  if (!interview) throw new Error("Interview not found");
  if (!canTransition(interview.interviewState, "INTUITION_EXPLAINED")) {
    throw new Error(`Cannot submit intuition from state: ${interview.interviewState}`);
  }

  const question = await DSAQuestion.findById(interview.questionId);
  if (!question) throw new Error("Question not found");

  const { verdict, feedback } = await llm.evaluateIntuition(roomId, question.description, intuitionText);

  // Store LLM intuition score
  interview.scores.intuition = verdictToScore(verdict);

  let message, nextState;

  if (verdict === "correct") {
    nextState = "INTUITION_APPROVED";
    message   = `${feedback} Great thinking! Now go ahead and write your code in the editor.`;
  } else if (verdict === "partial") {
    nextState = "INTUITION_EXPLAINED";
    message   = `${feedback} Can you refine your approach a bit more? What data structure would make this efficient?`;
  } else {
    // incorrect — give a nudge without counting as a hint
    nextState = "QUESTION_GIVEN";
    message   = `${feedback} Think about it differently. What's the brute force approach first?`;
  }

  interview.interviewState = nextState;
  interview.conversationLog.push({ role: "candidate", text: intuitionText });
  interview.conversationLog.push({ role: "ai", text: message });
  await interview.save();

  return { message, state: nextState, verdict };
}

// ─── Request hint ─────────────────────────────────────────────────────────────

/**
 * Increment hint level (max 4) and return the appropriate hint.
 * @returns {Promise<{message, state, hintLevel, penalty}>}
 */
async function requestHint(roomId) {
  const interview = await AIInterview.findOne({ roomId });
  if (!interview) throw new Error("Interview not found");

  const allowedStates = ["QUESTION_GIVEN", "INTUITION_EXPLAINED", "INTUITION_APPROVED", "CODE_WRITTEN"];
  if (!allowedStates.includes(interview.interviewState)) {
    return { message: "Hints are only available before and during the coding phase.", state: interview.interviewState, hintLevel: interview.hintLevel, penalty: interview.hintPenalty };
  }

  if (interview.hintLevel >= 4) {
    return { message: "You've used all available hints. Try implementing what you know!", state: interview.interviewState, hintLevel: 4, penalty: interview.hintPenalty };
  }

  interview.hintLevel++;

  const PENALTIES = [0, 5, 10, 20];
  interview.hintPenalty = PENALTIES[Math.min(interview.hintLevel, 3)];

  const question = await DSAQuestion.findById(interview.questionId);
  const hintText = await llm.generateHint(
    roomId,
    question?.description || "the problem",
    interview.hintLevel,
    question?.hints || []
  );

  const prefix = `💡 Hint ${interview.hintLevel}/4 (${interview.hintPenalty}% penalty applied):`;
  const message = `${prefix} ${hintText}`;

  interview.conversationLog.push({ role: "ai", text: message });
  await interview.save();

  return {
    message,
    state:     interview.interviewState,
    hintLevel: interview.hintLevel,
    penalty:   interview.hintPenalty
  };
}

// ─── Run code — CODE_WRITTEN → CODE_EVALUATED ─────────────────────────────────

/**
 * Execute candidate's code against test cases.
 * @returns {Promise<{message, state, testResults}>}
 */
async function runCandidateCode(roomId, code, language = "javascript") {
  const interview = await AIInterview.findOne({ roomId });
  if (!interview) throw new Error("Interview not found");

  const question = await DSAQuestion.findById(interview.questionId);
  if (!question) throw new Error("Question not found");

  // Save submitted code
  interview.submittedCode = code;
  interview.codeLanguage  = language;
  interview.codeSnapshots.push({ code, language });

  // Run against test cases
  const testResults = await runCode(code, language, question.testCases, question.functionName || "solution");
  interview.testResults = testResults;
  interview.interviewState = "CODE_EVALUATED";

  // Compute code correctness component
  const ratio = testResults.total > 0 ? testResults.passed / testResults.total : 0;
  interview.scores.codeCorrectness = Math.round(ratio * 100);

  await interview.save();

  // Build result message
  const successRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
  let message;
  if (testResults.passed === testResults.total) {
    message = `🎉 All ${testResults.total} test cases passed! Excellent work. Now, can you walk me through your solution? What's the time and space complexity?`;
  } else if (testResults.passed > 0) {
    message = `Your solution passed ${testResults.passed} out of ${testResults.total} test cases (${successRate}%). There are a few edge cases to fix. Can you explain your approach first — what's the time complexity?`;
  } else {
    message = `Your solution didn't pass any test cases yet. No worries — can you walk me through your logic? Sometimes explaining it out loud reveals the bug.`;
  }

  return { message, state: "CODE_EVALUATED", testResults };
}

// ─── Submit code explanation — CODE_EVALUATED → CODE_EXPLAINED ───────────────

/**
 * Store the candidate's complexity explanation.
 * @returns {Promise<{message, state}>}
 */
async function submitExplanation(roomId, explanationText) {
  const interview = await AIInterview.findOne({ roomId });
  if (!interview) throw new Error("Interview not found");

  const question = await DSAQuestion.findById(interview.questionId);

  // LLM generates follow-up questions about optimization/edge cases
  const followUpMsg = await llm.generateFollowUps(
    roomId,
    question?.description || "the problem",
    interview.submittedCode,
    interview.testResults
  );

  interview.interviewState = "CODE_EXPLAINED";
  interview.conversationLog.push({ role: "candidate", text: explanationText });
  interview.conversationLog.push({ role: "ai", text: followUpMsg });

  // Score code quality based on explanation quality (simple heuristic via LLM)
  interview.scores.codeQuality = 70; // default; refined by LLM in generateScores
  await interview.save();

  return { message: followUpMsg, state: "CODE_EXPLAINED" };
}

// ─── Generate final feedback — → FINAL_FEEDBACK ──────────────────────────────

/**
 * Generate the complete interview report.
 * @returns {Promise<{message, state, scores, report}>}
 */
async function generateFinalFeedback(roomId) {
  const interview = await AIInterview.findOne({ roomId });
  if (!interview) throw new Error("Interview not found");

  // LLM generates narrative scores
  const llmScores = await llm.generateScores(roomId);

  // Merge LLM soft scores into our scoring
  interview.scores.communication = Math.round(llmScores.communication / 10 * 100);
  interview.scores.codeQuality   = Math.round(llmScores.technical   / 10 * 100);

  // Compute final composite score
  const finalScores = computeScore({
    passed:         interview.testResults?.passed      || 0,
    total:          interview.testResults?.total       || 1,
    intuitionScore: interview.scores.intuition         || 0,
    codeQuality:    interview.scores.codeQuality       || 0,
    communication:  interview.scores.communication     || 0,
    hintLevel:      interview.hintLevel                || 0
  });

  // Merge into interview doc
  interview.scores.codeCorrectness = finalScores.codeCorrectness;
  interview.scores.intuition       = finalScores.intuition;
  interview.scores.codeQuality     = finalScores.codeQuality;
  interview.scores.communication   = finalScores.communication;
  interview.scores.overall         = finalScores.overall;
  interview.hintPenalty            = finalScores.hintPenalty;
  interview.aiSummary              = llmScores.summary;
  interview.interviewState         = "FINAL_FEEDBACK";
  interview.status                 = "Completed";
  interview.completedAt            = new Date();
  await interview.save();

  const feedbackText = buildFeedbackSummary(
    finalScores,
    interview.testResults || { passed: 0, total: 0, errors: [] },
    interview.hintLevel,
    llmScores.summary
  );

  llm.destroySession(roomId);

  return {
    message: feedbackText,
    state:   "FINAL_FEEDBACK",
    scores:  finalScores,
    report:  interview
  };
}

module.exports = {
  startDSAInterview,
  submitIntuition,
  requestHint,
  runCandidateCode,
  submitExplanation,
  generateFinalFeedback
};
