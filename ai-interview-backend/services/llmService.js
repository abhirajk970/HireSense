/**
 * llmService.js  — Ollama / LLaMA 3 backend
 *
 * Replaces all Gemini calls with local Ollama HTTP API.
 * Interface is IDENTICAL to the old service, so server.js needs no changes.
 *
 * Ollama API endpoint used:
 *   POST http://localhost:11434/api/chat
 *   { model, messages: [{role,content}], stream: false }
 */

const axios = require("axios");

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

// In-memory sessions: roomId → { history, systemPrompt, jobContext }
const sessions = new Map();

// ─── Ollama raw caller ───────────────────────────────────────────────────────

/**
 * Call Ollama chat API.
 * @param {Array<{role:string,content:string}>} messages
 * @returns {Promise<string>} assistant reply text
 */
async function callOllama(messages) {
  const res = await axios.post(
    `${OLLAMA_BASE}/api/chat`,
    { model: OLLAMA_MODEL, messages, stream: false },
    { timeout: 60000 }
  );
  return res.data.message?.content?.trim() || "";
}

// ─── History builder ─────────────────────────────────────────────────────────

/**
 * Build the messages array for Ollama from session history.
 * Keeps system prompt first, then last N exchanges to avoid context blowup.
 */
function buildMessages(session, newUserText = null) {
  const MAX_HISTORY = 20; // last 20 turns
  const msgs = [{ role: "system", content: session.systemPrompt }];

  const history = session.history.slice(-MAX_HISTORY);
  for (const entry of history) {
    msgs.push({
      role: entry.role === "ai" ? "assistant" : "user",
      content: entry.text
    });
  }

  if (newUserText) {
    msgs.push({ role: "user", content: newUserText });
  }

  return msgs;
}

// ─── System Prompt ───────────────────────────────────────────────────────────

function getSystemPrompt(jobContext) {
  const dsaQ = jobContext.dsaQuestion;
  const questionSection = dsaQ
    ? `The candidate is solving this DSA problem:\nTitle: ${dsaQ.title} (${dsaQ.difficulty})\n\n${dsaQ.description}`
    : (jobContext.questions || []).map((q, i) => `${i + 1}. ${q.questionText} (${q.difficulty || "Medium"})`).join("\n") || "Generate appropriate technical questions.";

  return `You are a proactive senior technical interviewer for a ${jobContext.stageName || "Technical"} interview for the "${jobContext.jobTitle || "Software Engineer"}" role at ${jobContext.companyName || "the company"}.

${questionSection}

BEHAVIOR RULES — strictly follow every rule:
1. ALWAYS end every single message with one of: a direct question, a directive ("Now write your algorithm step by step"), or an offer ("Would you like a hint?"). Never end without engaging the candidate.
2. YOU drive the interview forward. Do not wait passively. If candidate is done with a topic, explicitly move on: "Great, let's move to the next phase."
3. After candidate shares approach: evaluate it briefly and say "Ready to write the algorithm?" or "Go ahead and code it up."
4. If candidate response is short, vague, or says "I don't know" / "I'm stuck": immediately offer a hint or ask a more specific guiding question.
5. If candidate seems idle or sends a very short reply: ask "Are you still working through it? Would a hint help?"
6. After explaining complexity or follow-up questions: say "Good, that wraps up this problem. Shall we move on?"
7. Keep responses SHORT — 2 to 4 sentences maximum. This is real-time.
8. Do NOT use bullet points or markdown. Speak naturally as a human interviewer.
9. After 15–20 total exchanges, thank the candidate warmly and end with exactly: INTERVIEW_COMPLETE`;
}

// ─── Mock fallback (used when Ollama is unreachable) ─────────────────────────

const MOCK_QUESTIONS = [
  "Hello! Welcome to the interview. Before we start, could you briefly introduce yourself and what excites you about this role?",
  "Great! Let's begin. Can you explain the difference between a stack and a queue, and when you'd use each?",
  "Good. Now, write a function that checks if a string of parentheses is balanced. For example, '(())' is balanced but '(()' is not.",
  "What's the time and space complexity of your solution? Could you optimize it?",
  "Let's try system design. How would you design a URL shortener like bit.ly at a high level?",
  "How would you handle hash collisions in your URL shortener?",
  "One more coding question: find the first non-repeating character in a string. In 'aabcbd' it should return 'c'.",
  "Well done! Tell me about a challenging project you've worked on and how you overcame the hardest part.",
  "Thank you so much for your time today! You've done a great job. We'll be in touch soon. INTERVIEW_COMPLETE"
];

function createMockSession(roomId, jobContext) {
  const session = { mock: true, questionIndex: 1, history: [], systemPrompt: "", jobContext };
  const greeting = MOCK_QUESTIONS[0];
  session.history.push({ role: "ai", text: greeting });
  sessions.set(roomId, session);
  return greeting;
}

function mockSendMessage(roomId, candidateText) {
  const session = sessions.get(roomId);
  if (!session) throw new Error("Session not found");
  session.history.push({ role: "candidate", text: candidateText });

  const idx = session.questionIndex;
  const reply = idx < MOCK_QUESTIONS.length
    ? MOCK_QUESTIONS[idx]
    : "That's a great point! Thank you for sharing. INTERVIEW_COMPLETE";

  session.history.push({ role: "ai", text: reply });
  session.questionIndex++;
  return reply;
}

function mockGenerateScores() {
  return {
    communication: 7,
    technical: 7,
    problemSolving: 7,
    overall: 7,
    summary: "The candidate demonstrated solid fundamentals with clear communication. Good problem-solving instincts. Areas for growth: deeper system design and edge case handling."
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize an interview session and return the AI greeting.
 */
async function initSession(roomId, jobContext) {
  const systemPrompt = getSystemPrompt(jobContext);

  try {
    console.log(`[LLM] Initializing Ollama session for room: ${roomId}`);
    console.log(`[LLM] Model: ${OLLAMA_MODEL} @ ${OLLAMA_BASE}`);

    const greeting = await callOllama([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Start the interview now with a brief greeting and ice-breaker question." }
    ]);

    const session = { history: [{ role: "ai", text: greeting }], systemPrompt, jobContext, mock: false };
    sessions.set(roomId, session);

    console.log(`[LLM] Session initialized. Greeting: "${greeting.substring(0, 80)}..."`);
    return greeting;

  } catch (err) {
    console.warn(`[LLM] Ollama unreachable (${err.message}). Falling back to MOCK interviewer.`);
    return createMockSession(roomId, jobContext);
  }
}

/**
 * Send a candidate message and get the AI response.
 */
async function sendMessage(roomId, candidateText) {
  const session = sessions.get(roomId);
  if (!session) throw new Error("Session not found. Please start the interview first.");

  if (session.mock) {
    return mockSendMessage(roomId, candidateText);
  }

  session.history.push({ role: "candidate", text: candidateText });

  try {
    const messages = buildMessages(session);
    const reply = await callOllama(messages);
    session.history.push({ role: "ai", text: reply });
    return reply;

  } catch (err) {
    console.warn(`[LLM] Ollama failed mid-conversation, switching to mock: ${err.message}`);
    session.mock = true;
    session.questionIndex = Math.min(
      session.history.filter(h => h.role === "ai").length,
      MOCK_QUESTIONS.length - 1
    );
    return mockSendMessage(roomId, candidateText);
  }
}

/**
 * Ask Ollama to evaluate the candidate's intuition/approach.
 * Returns: { verdict: "correct"|"partial"|"incorrect", feedback: string }
 */
async function evaluateIntuition(roomId, questionDescription, candidateText) {
  const prompt = `You are evaluating a candidate's approach to a DSA problem.

Problem: ${questionDescription}

Candidate's approach: "${candidateText}"

Evaluate their intuition. Respond ONLY with valid JSON (no markdown):
{
  "verdict": "correct" | "partial" | "incorrect",
  "feedback": "One concise sentence of feedback for the candidate"
}`;

  try {
    const raw = await callOllama([{ role: "user", content: prompt }]);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { verdict: parsed.verdict || "partial", feedback: parsed.feedback || "Interesting approach, let's continue." };
  } catch (e) {
    console.warn("[LLM] Intuition evaluation parse failed:", e.message);
    return { verdict: "partial", feedback: "I see your thinking. Let's proceed to coding." };
  }
}

/**
 * Generate a hint at a specific level for a question.
 * Returns a hint string.
 */
async function generateHint(roomId, questionDescription, hintLevel, prebuiltHints = []) {
  // Use prebuilt hints from DB if available
  if (prebuiltHints && prebuiltHints[hintLevel - 1]) {
    return prebuiltHints[hintLevel - 1];
  }

  const levelDescriptions = [
    "Give a very vague directional hint — just point them in the right direction without specifics.",
    "Give a structural hint — hint at the data structure or technique they should use, but not how.",
    "Give a stronger hint — mention the key insight or approach directly.",
    "Give an almost-solution hint — describe the algorithm steps without writing code."
  ];

  const prompt = `You are a technical interviewer giving a Level ${hintLevel} hint.

Problem: ${questionDescription}

Hint instruction: ${levelDescriptions[hintLevel - 1] || levelDescriptions[0]}

Rules:
- Do NOT reveal the full solution.
- Keep it to 1-2 sentences.
- Be progressive — this is hint level ${hintLevel} of 4.

Give only the hint text, no extra commentary.`;

  try {
    return await callOllama([{ role: "user", content: prompt }]);
  } catch (e) {
    const fallbacks = [
      "Think about how you could reduce repeated work.",
      "Consider which data structure gives O(1) lookup.",
      "A hash map storing seen values is the key insight here.",
      "For each element, check if (target - element) already exists in your map."
    ];
    return fallbacks[hintLevel - 1] || fallbacks[0];
  }
}

/**
 * Ask LLM to generate follow-up questions after code evaluation.
 */
async function generateFollowUps(roomId, questionDescription, code, testResults) {
  const prompt = `You are a technical interviewer. The candidate just submitted code for this problem:

Problem: ${questionDescription}

Their code passed ${testResults.passed}/${testResults.total} test cases.

Generate 2 short follow-up questions to probe:
1. Time and space complexity of their solution
2. How they'd handle an edge case or scale this

Respond as the interviewer in a conversational tone (1-2 sentences total). Do not use bullet points.`;

  try {
    return await callOllama([{ role: "user", content: prompt }]);
  } catch (e) {
    return `Good effort! Can you walk me through the time and space complexity of your solution? Also, how would you handle very large inputs?`;
  }
}

/**
 * Generate final structured scores from the full conversation.
 */
async function generateScores(roomId) {
  const session = sessions.get(roomId);
  if (!session) throw new Error("Session not found");

  if (session.mock) return mockGenerateScores();

  const conversationText = session.history
    .map(m => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.text}`)
    .join("\n");

  const prompt = `You are evaluating a technical interview transcript. Provide scores (1–10) and a summary.

Transcript:
${conversationText.substring(0, 4000)}

Respond ONLY with valid JSON (no markdown):
{
  "communication": <1-10>,
  "technical": <1-10>,
  "problemSolving": <1-10>,
  "overall": <1-10>,
  "summary": "<2-3 sentence evaluation>"
}`;

  try {
    const raw = await callOllama([{ role: "user", content: prompt }]);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      communication:   parsed.communication   || 7,
      technical:       parsed.technical       || 7,
      problemSolving:  parsed.problemSolving  || 7,
      overall:         parsed.overall         || 7,
      summary:         parsed.summary         || "Evaluation completed."
    };
  } catch (e) {
    console.warn("[LLM] Score generation failed:", e.message);
    return mockGenerateScores();
  }
}

function getHistory(roomId) {
  return sessions.get(roomId)?.history || [];
}

function destroySession(roomId) {
  sessions.delete(roomId);
}

module.exports = {
  initSession,
  sendMessage,
  evaluateIntuition,
  generateHint,
  generateFollowUps,
  generateScores,
  getHistory,
  destroySession
};
