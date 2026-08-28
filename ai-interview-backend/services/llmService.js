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
const AIInterview = require("../models/AIInterview");
const DSAQuestion = require("../models/DSAQuestion");

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

// Session Management via Redis Client
const redis = require("./redisClient");

// ─── Ollama raw caller ───────────────────────────────────────────────────────

/**
 * Call Ollama chat API.
 * @param {Array<{role:string,content:string}>} messages
 * @returns {Promise<string>} assistant reply text
 */
async function callOllama(messages) {
  const res = await axios.post(
    `${OLLAMA_BASE}/api/chat`,
    { 
      model: OLLAMA_MODEL, 
      messages, 
      stream: false,
      options: {
        temperature: 0.6,
        num_predict: 120
      }
    },
    { timeout: 60000 }
  );
  return res.data.message?.content?.trim() || "";
}

// ─── LLaMA 8B Optimization Utilities ─────────────────────────────────────────

/**
 * Compress raw candidate response to 1 sentence using secondary Ollama call.
 */
async function summarizeCandidateAnswer(text) {
  try {
    const summary = await callOllama([
      { role: "system", content: "You are a professional technical data compiler. Compress the candidate's response into exactly one short sentence of core technical facts only. Output nothing else." },
      { role: "user", content: `Compress this candidate response: "${text}"` }
    ]);
    return summary.replace(/^"|"$/g, "").trim() || text.substring(0, 100);
  } catch (e) {
    console.warn("[LLM] Answer summarization failed:", e.message);
    return text.substring(0, 150) + "...";
  }
}

/**
 * Summarize older conversation exchanges to prevent context degradation.
 */
async function compactOldHistory(exchangesToCompact) {
  const textToCompact = exchangesToCompact.map(h => `${h.role === "ai" ? "Interviewer" : "Candidate"}: ${h.text}`).join("\n");
  try {
    const summary = await callOllama([
      { role: "system", content: "Summarize this technical interview transcript segment in exactly 2 sentences, detailing what was discussed and agreed upon. Output only the summary." },
      { role: "user", content: textToCompact }
    ]);
    return summary.trim();
  } catch (e) {
    console.warn("[LLM] History compaction failed:", e.message);
    return "The interview was initiated and introductory questions were discussed.";
  }
}

/**
 * Strip positive affirmations, limit questions to exactly one, and clean character breaks.
 */
function validateAndFormatOutput(reply, state) {
  if (!reply) return "";

  let cleaned = reply;
  
  // 1. Strip positive validations / praises to keep a professional neutral tone
  const praises = [
    /Great work!/gi, /Great job!/gi, /Excellent job!/gi, /Good job!/gi, 
    /Excellent approach!/gi, /Great approach!/gi, /Perfect!/gi, /Awesome!/gi, 
    /Excellent!/gi, /Good work!/gi, /That is correct!/gi, /That approach is correct!/gi,
    /That's correct!/gi, /Spot on!/gi, /Exactly!/gi, /Wonderful!/gi, /Awesome, tests passed!/gi,
    /🎉 All \d+ test cases passed! Excellent work\./gi
  ];
  
  praises.forEach(regex => {
    cleaned = cleaned.replace(regex, "");
  });

  // Clean double spaces or leading/trailing punctuation resulting from praise stripping
  cleaned = cleaned.replace(/^\s*[,.!?;:]+\s*/g, ""); // strip leading punctuation
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // 2. Ensure exactly ONE question / directive.
  if ((cleaned.match(/\?/g) || []).length > 1) {
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    let questionFound = false;
    const finalSentences = [];
    
    for (const s of sentences) {
      if (s.includes("?")) {
        if (!questionFound) {
          finalSentences.push(s);
          questionFound = true;
        }
      } else {
        finalSentences.push(s);
      }
    }
    cleaned = finalSentences.join(" ");
  }

  // 3. Prevent typical LLaMA "As an AI assistant" breaks
  if (cleaned.toLowerCase().includes("as an ai") || cleaned.toLowerCase().includes("language model")) {
    cleaned = "I am here to evaluate your software engineering skills. Let's focus on the problem at hand.";
  }

  // 4. Force trailing question if LLM forgot one (unless wrap-up state)
  if (state !== "FINAL_FEEDBACK" && !cleaned.includes("?") && !cleaned.includes("explain") && !cleaned.includes("let me know") && !cleaned.includes("tell me")) {
    cleaned += " What are your thoughts on this?";
  }

  return cleaned.trim();
}

/**
 * Define state-specific directives and inject 2-shot human examples per state.
 */
function getStateDirectivesAndFewShots(state, question = null) {
  const funcName = question?.functionName || "solution";
  
  switch(state) {
    case "INIT":
      return {
        instruction: "Greet the candidate warmly, ask them to briefly introduce themselves and mention a challenging recent project. Ask ONE question.",
        fewShot: `Example:
Interviewer: Hi, welcome! I'm Alex. Let's start with a quick introduction—tell me a bit about yourself and a project you've worked on recently.
Candidate: I'm a full stack dev. Recently I built a high-performance chat system using WebSockets...
Interviewer: That sounds interesting. What was the most challenging part of designing that real-time system?`
      };
    case "QUESTION_GIVEN":
      return {
        instruction: "Introduce the DSA question in their workspace, ask them to read it and let you know their high-level approach/intuition. Ask ONE question.",
        fewShot: `Example:
Interviewer: I've unlocked the assigned DSA problem in your workspace. Take 2 minutes to gather your thoughts, and let me know your high-level approach or intuition when you're ready.
Candidate: I'd probably use a nested loop to check every pair...
Interviewer: Got it. That brute force would be O(N^2) time. Can we do better than O(N^2) using another data structure?`
      };
    case "INTUITION_APPROVED":
      return {
        instruction: "Acknowledge that their approach is correct! Ask them to write down their detailed step-by-step algorithm or pseudocode in the Notebook panel. Ask ONE question.",
        fewShot: `Example:
Interviewer: That approach using a hash map is correct! Please write down your detailed algorithm or pseudocode in the Notebook panel.
Candidate: [sends pseudocode]
Interviewer: Excellent pseudocode. Now, let's implement this solution in the Monaco editor.`
      };
    case "CODE_WRITTEN":
      return {
        instruction: `Instruct them to switch to the IDE Coding Workspace tab, implement the solution in the Monaco editor, and run the tests. Explicitly guide them to name their function \`${funcName}\`. Ask ONE question.`,
        fewShot: `Example:
Interviewer: Great! Switch to the IDE Coding Workspace tab, implement the solution in the editor, and run the tests. Your function should be named "${funcName}". Let me know when you run the tests.
Candidate: Can I write helper methods?
Interviewer: Yes, you can write helper methods, but make sure the main function remains "${funcName}". Let me know when tests pass.`
      };
    case "CODE_EVALUATED":
      return {
        instruction: "The tests have run. Ask them what the time and space complexity of their solution is, and how they would optimize it. Ask ONE question.",
        fewShot: `Example:
Interviewer: Awesome, tests passed! What is the time and space complexity of your solution?
Candidate: It takes O(N) time and O(N) space.
Interviewer: Correct. Let's discuss follow-up variations.`
      };
    case "CODE_EXPLAINED":
    case "FOLLOW_UP":
      return {
        instruction: "Ask a short follow-up question probing edge cases, duplicates, or performance improvements. Ask ONE question.",
        fewShot: `Example:
Interviewer: Correct, O(N) time is optimal. How would you handle duplicates in the input array?
Candidate: I could store a list of indices in the map...
Interviewer: That works. What if the input array is extremely large and memory is highly constrained?`
      };
    case "FINAL_FEEDBACK":
      return {
        instruction: "Give a brief professional, neutral 1-sentence feedback. Conclude the interview and thank them. You MUST end your response with exactly: INTERVIEW_COMPLETE",
        fewShot: `Example:
Interviewer: Solid communication and good problem solving. Thank you for your time today! INTERVIEW_COMPLETE`
      };
    default:
      return {
        instruction: "Keep the conversation professional, concise and neutral.",
        fewShot: ""
      };
  }
}

// ─── History builder ─────────────────────────────────────────────────────────

/**
 * Build the messages array for Ollama from session history.
 * Keeps system prompt first, then last N exchanges to avoid context blowup.
 */
async function buildMessages(session, stateDirective = null, fewShotContext = null) {
  let compactedContext = "";
  let activeHistory = session.history;
  
  // Compact oldest history if it grows too large (keep last 8 turns of active history)
  if (session.history.length > 8) {
    const toCompact = session.history.slice(0, session.history.length - 8);
    activeHistory = session.history.slice(-8);
    session.compactedSummary = await compactOldHistory(toCompact);
    compactedContext = `[PREVIOUSLY COVERED IN INTERVIEW] ${session.compactedSummary}\n\n`;
  }
  
  let content = session.systemPrompt + "\n\n" + compactedContext;
  if (stateDirective) {
    content += `CURRENT STATE INSTRUCTION: ${stateDirective}\n\n`;
  }
  if (fewShotContext) {
    content += `${fewShotContext}\n\n`;
  }
  
  const msgs = [{ role: "system", content }];

  for (const entry of activeHistory) {
    msgs.push({
      role: entry.role === "ai" ? "assistant" : "user",
      content: entry.text
    });
  }

  return msgs;
}

// ─── System Prompt ───────────────────────────────────────────────────────────

function getSystemPrompt(jobContext) {
  const dsaQ = jobContext.dsaQuestion;
  const questionSection = dsaQ
    ? `The candidate is solving this DSA problem:\nTitle: ${dsaQ.title} (${dsaQ.difficulty})\n\n${dsaQ.description}`
    : "";

  return `You are Alex, a senior technical interviewer for a human-like "${jobContext.jobTitle || "Software Engineer"}" technical interview at ${jobContext.companyName || "the company"}.
${questionSection}

HUMAN TECHNICAL INTERVIEWER RULES:
1. Act exactly like a real human senior tech lead. NEVER say "As an AI..." or "I am a language model...". Speak naturally.
2. DO NOT use markdown lists, bullet points, or heavy headers. Speak in professional paragraph form.
3. Keep responses SHORT and CONCISE (generally 30-40 words max) to sound conversational.
4. BE NEUTRAL: internally evaluate, but do NOT echo back what the candidate just said or praise them. Real human interviewers are neutral and brief.
5. ALWAYS ask exactly ONE clear technical question or conversational directive. Never ask multiple questions.`;
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

async function createMockSession(roomId, jobContext) {
  const session = { mock: true, questionIndex: 1, history: [], systemPrompt: "", jobContext };
  const greeting = MOCK_QUESTIONS[0];
  session.history.push({ role: "ai", text: greeting });
  await redis.setHash(roomId, session);
  return greeting;
}

async function mockSendMessage(roomId, candidateText) {
  const session = await redis.getHash(roomId);
  if (!session) throw new Error("Session not found");
  session.history.push({ role: "candidate", text: candidateText });

  const idx = session.questionIndex;
  const reply = idx < MOCK_QUESTIONS.length
    ? MOCK_QUESTIONS[idx]
    : "That's a point! Thank you for sharing. INTERVIEW_COMPLETE";

  session.history.push({ role: "ai", text: reply });
  session.questionIndex++;
  await redis.setHash(roomId, session);
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

// ─── LP Question Pool (SDE) ───────────────────────────────────────────────────
const LP_QUESTIONS = [
  "Tell me about a time you had to push back on a technical decision you disagreed with. What happened and what did you learn?",
  "Describe a situation where you had to deliver a project under a very tight deadline. How did you prioritize and what trade-offs did you make?",
  "Give me an example of a time you identified a significant technical risk in a project. How did you handle it?",
  "Tell me about a time you had to learn a completely new technology or framework under pressure. How did you approach it?",
  "Describe a situation where you had a major disagreement with a teammate. How did you resolve it while keeping the team productive?"
];

/**
 * Detect if intro conversation is exhausted — returns true when the AI should move to DSA.
 * We ask Ollama to judge based on the conversation.
 */
async function detectIntroExhausted(history) {
  const recent = history.slice(-6); // look at last 3 exchanges
  const text = recent.map(h => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.text}`).join('\n');
  const prompt = `You are judging whether an intro/warmup section of a technical interview is complete.

Here is the recent conversation:
${text}

Has the candidate adequately introduced themselves and discussed a past project? 
Respond with ONLY one word: "yes" or "no".`;
  try {
    const raw = await callOllama([{ role: 'user', content: prompt }]);
    return raw.toLowerCase().includes('yes');
  } catch (e) {
    // Default: advance after 6+ exchanges total
    return history.length >= 8;
  }
}

/**
 * Score the candidate's intuition for code-path decision.
 * Returns { score: 1-10, action: 'code_directly'|'write_algo' }
 */
async function scoreIntuitionConviction(questionDesc, candidateText) {
  const prompt = `You are a senior technical interviewer evaluating a candidate's problem-solving intuition.

Problem: ${questionDesc}

Candidate's explanation: "${candidateText}"

Score their intuition from 1-10 where:
- 8-10: They clearly understand the optimal approach (hash map, two pointers, etc.)
- 5-7: They understand the problem but are vague on the optimal approach
- 1-4: They don't have a clear approach

Respond ONLY with valid JSON:
{"score": <1-10>, "action": "code_directly" | "write_algo", "feedback": "<one sentence>"}`;
  try {
    const raw = await callOllama([{ role: 'user', content: prompt }]);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      score: parsed.score || 5,
      action: parsed.score >= 7 ? 'code_directly' : 'write_algo',
      feedback: parsed.feedback || 'Interesting. Let me guide you further.'
    };
  } catch (e) {
    return { score: 5, action: 'write_algo', feedback: 'Let\'s work through the algorithm step by step.' };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize an interview session and return the AI greeting.
 */
async function initSession(roomId, jobContext, existingHistory = null, startedAt = null) {
  // Clear any old session details
  await redis.deleteKey(roomId);

  const systemPrompt = getSystemPrompt(jobContext);

  try {
    console.log(`[LLM] Initializing Ollama session for room: ${roomId}`);
    console.log(`[LLM] Model: ${OLLAMA_MODEL} @ ${OLLAMA_BASE}`);

    let greeting = "";
    let history = [];

    if (existingHistory && existingHistory.length > 0) {
      history = existingHistory.map(h => ({ role: h.role, text: h.text }));
      greeting = history.filter(h => h.role === "ai").slice(-1)[0]?.text || "";
      console.log(`[LLM] Reconstructed session memory with ${history.length} historical messages`);
    } else {
      const msgs = await buildMessages(
        { history: [], systemPrompt },
        "Greet the candidate warmly, ask them to briefly introduce themselves and mention a challenging recent project. Ask ONE question.",
        `Example:
Interviewer: Hi, welcome! I'm Alex. Let's start with a quick introduction—tell me a bit about yourself and a project you've worked on recently.`
      );
      greeting = await callOllama(msgs);
      greeting = validateAndFormatOutput(greeting, "INIT");
      history = [{ role: "ai", text: greeting }];
    }

    const session = { 
      history, 
      systemPrompt, 
      jobContext, 
      mock: false, 
      startedAt: startedAt ? new Date(startedAt).getTime() : Date.now(), 
      dsaRevealed: existingHistory ? true : false 
    };
    await redis.setHash(roomId, session);

    console.log(`[LLM] Session initialized. Greeting preview: "${greeting.substring(0, 80)}..."`);
    return greeting;

  } catch (err) {
    console.warn(`[LLM] Ollama unreachable (${err.message}). Falling back to MOCK interviewer.`);
    return await createMockSession(roomId, jobContext);
  }
}

/**
 * Send a candidate message and get the AI response.
 * Returns: { reply: string, stageAction?: { type: string, payload?: any } }
 */
async function sendMessage(roomId, candidateText, onPhaseChange) {
  const session = await redis.getHash(roomId);
  if (!session) throw new Error("Session not found. Please start the interview first.");

  if (session.mock) {
    return { reply: await mockSendMessage(roomId, candidateText) };
  }

  // 1. Fetch AIInterview from database to execute state-driven transitions
  let interview = await AIInterview.findOne({ roomId });
  if (!interview) {
    // Fallback if interview not initialized in DB
    interview = await AIInterview.create({ roomId, interviewState: "INIT", status: "InProgress", startedAt: new Date() });
  }

  let currentState = interview.interviewState || "INIT";
  // Track interview stage in session (INTRO/DSA/LP/DONE)
  if (!session.interviewStage) session.interviewStage = 'INTRO';
  const interviewStage = session.interviewStage;

  let stageAction = null; // { type, payload } — sent to frontend

  let dsaQuestion = null;
  if (interview.questionId) {
    dsaQuestion = await DSAQuestion.findById(interview.questionId);
  } else if (session.jobContext.dsaQuestion) {
    dsaQuestion = session.jobContext.dsaQuestion;
  }

  // ─── STAGE: INTRO ──────────────────────────────────────────────────────────
  if (interviewStage === 'INTRO') {
    session.history.push({ role: 'candidate', text: candidateText });

    // Check if intro is exhausted after each exchange
    const introExhausted = await detectIntroExhausted(session.history);
    if (introExhausted) {
      // Signal frontend to advance to DSA stage
      session.interviewStage = 'DSA';
      interview.interviewState = 'INIT'; // DSA starts at INIT
      await interview.save();
      await redis.setHash(roomId, session);
      return {
        reply: "Great discussion! That gives me a solid picture of your background. Let's shift gears now — we'll move into the technical portion of the interview.",
        stageAction: { type: 'ADVANCE_STAGE', payload: { stage: 'DSA' } }
      };
    }

    // Still in intro — generate conversational response
    const introConfig = getStateDirectivesAndFewShots('INIT', null);
    const msgs = await buildMessages(session, introConfig.instruction, introConfig.fewShot);
    let reply = await callOllama(msgs);
    reply = validateAndFormatOutput(reply, 'INIT');
    session.history.push({ role: 'ai', text: reply });
    interview.conversationLog.push({ role: 'candidate', text: candidateText }, { role: 'ai', text: reply });
    await interview.save();
    await redis.setHash(roomId, session);
    return { reply };
  }

  // ─── STAGE: DSA ─────────────────────────────────────────────────────────────
  if (interviewStage === 'DSA') {
    if (currentState === "INIT") {
      interview.interviewState = "QUESTION_GIVEN";

      const count = await DSAQuestion.countDocuments({ isActive: true });
      if (count > 0) {
        const skip = Math.floor(Math.random() * count);
        dsaQuestion = await DSAQuestion.findOne({ isActive: true }).skip(skip);
      }

      if (dsaQuestion) {
        interview.questionId = dsaQuestion._id;
        interview.currentQuestionIndex = 0;
        session.jobContext.dsaQuestion = dsaQuestion;
        session.dsaRevealed = true;
        if (onPhaseChange) {
          onPhaseChange("DSA", {
            id: dsaQuestion._id,
            title: dsaQuestion.title,
            difficulty: dsaQuestion.difficulty,
            description: dsaQuestion.description,
            functionName: dsaQuestion.functionName || "solution"
          });
        }
      }
      currentState = "QUESTION_GIVEN";
    }
    else if (currentState === "QUESTION_GIVEN") {
      // Evaluate intuition with conviction scoring
      const conviction = await scoreIntuitionConviction(dsaQuestion?.description || '', candidateText);
      interview.scores.intuition = conviction.score * 10;

      if (conviction.action === 'code_directly') {
        interview.interviewState = "INTUITION_APPROVED";
        currentState = "INTUITION_APPROVED";
        stageAction = { type: 'DSA_ACTION', payload: { action: 'code_directly', message: conviction.feedback } };
      } else {
        interview.interviewState = "INTUITION_EXPLAINED";
        currentState = "INTUITION_EXPLAINED";
        stageAction = { type: 'DSA_ACTION', payload: { action: 'write_algo', message: conviction.feedback } };
      }
    }
    else if (currentState === "INTUITION_EXPLAINED") {
      // Candidate wrote algorithm/pseudocode — now code it up
      interview.interviewState = "INTUITION_APPROVED";
      currentState = "INTUITION_APPROVED";
    }
    else if (currentState === "INTUITION_APPROVED") {
      interview.interviewState = "CODE_WRITTEN";
      currentState = "CODE_WRITTEN";
    }
    else if (currentState === "CODE_WRITTEN") {
      interview.interviewState = "CODE_WRITTEN";
      currentState = "CODE_WRITTEN";
    }
    else if (currentState === "CODE_EVALUATED") {
      interview.interviewState = "FOLLOW_UP";
      currentState = "FOLLOW_UP";
    }
    else if (currentState === "FOLLOW_UP") {
      // DSA done — move to LP stage
      session.interviewStage = 'LP';
      session.lpIndex = 0;
      // Shuffle LP questions and pick 3
      const shuffled = [...LP_QUESTIONS].sort(() => Math.random() - 0.5);
      session.lpQuestions = shuffled.slice(0, 3);
      interview.interviewState = "FINAL_FEEDBACK";
      await interview.save();
      await redis.setHash(roomId, session);
      return {
        reply: "Great job on the technical problem! Now we'll do a quick leadership and behavioral round — just 3 questions. These help us understand how you work with teams and handle challenges. Ready?",
        stageAction: { type: 'ADVANCE_STAGE', payload: { stage: 'LP' } }
      };
    }

    await interview.save();
  }

  // ─── STAGE: LP ─────────────────────────────────────────────────────────────────
  if (interviewStage === 'LP') {
    const lpIndex = session.lpIndex || 0;
    const lpQuestions = session.lpQuestions || LP_QUESTIONS.slice(0, 3);
    session.history.push({ role: 'candidate', text: candidateText });

    if (lpIndex >= lpQuestions.length) {
      // All LP questions answered — wrap up
      session.interviewStage = 'DONE';
      await redis.setHash(roomId, session);
      interview.status = 'Completed';
      interview.completedAt = new Date();
      if (!interview.isDemo) interview.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await interview.save();
      return {
        reply: "That wraps up our leadership round. You've been great today — clear thinking, solid communication. We'll be in touch with feedback soon. Thank you! INTERVIEW_COMPLETE",
        stageAction: { type: 'ADVANCE_STAGE', payload: { stage: 'DONE' } }
      };
    }

    // Ask next LP question or evaluate current answer
    const currentQ = lpQuestions[lpIndex];
    const lpPrompt = `You are an SDE interviewer in the behavioral/leadership round.

Your current LP question to the candidate was: "${currentQ}"

Candidate's response: "${candidateText}"

Briefly acknowledge their answer in 1 sentence (neutral, not overly positive), then ask one focused follow-up. Keep it under 40 words total.`;

    let reply;
    try {
      reply = await callOllama([{ role: 'user', content: lpPrompt }]);
      reply = reply.trim();
    } catch (e) {
      reply = 'I see. Can you tell me more about the specific actions you took and the outcome?';
    }

    // After the follow-up, move to next LP question on next exchange
    session.lpIndex = lpIndex + 1;
    const nextQ = lpQuestions[lpIndex + 1];
    if (nextQ) {
      reply += ` \n\nAlright, let's move on. Here's the next one: ${nextQ}`;
    }

    session.history.push({ role: 'ai', text: reply });
    interview.conversationLog.push({ role: 'candidate', text: candidateText }, { role: 'ai', text: reply });
    await interview.save();
    await redis.setHash(roomId, session);
    return { reply, stageAction: { type: 'LP_QUESTION', payload: { question: nextQ || null, index: lpIndex + 1, total: lpQuestions.length } } };
  }

  // DSA stage fallback for general chat during coding
  const wordCount = candidateText.split(/\s+/).length;
  let textToStore = candidateText;
  if (wordCount > 50) {
    console.log(`[LLM] Summarizing candidate response (${wordCount} words)...`);
    textToStore = await summarizeCandidateAnswer(candidateText);
    console.log(`[LLM] Compacted to: "${textToStore}"`);
  }

  session.history.push({ role: "candidate", text: textToStore });

  try {
    const stateConfig = getStateDirectivesAndFewShots(currentState, dsaQuestion);
    const messages = await buildMessages(session, stateConfig.instruction, stateConfig.fewShot);
    let reply = await callOllama(messages);
    reply = validateAndFormatOutput(reply, currentState);
    session.history.push({ role: "ai", text: reply });
    interview.conversationLog.push({ role: "candidate", text: candidateText });
    interview.conversationLog.push({ role: "ai", text: reply });
    await interview.save();
    await redis.setHash(roomId, session);
    return { reply, stageAction };
  } catch (err) {
    console.warn(`[LLM] Ollama failed mid-conversation, switching to mock: ${err.message}`);
    session.mock = true;
    session.questionIndex = Math.min(
      session.history.filter(h => h.role === "ai").length,
      MOCK_QUESTIONS.length - 1
    );
    await redis.setHash(roomId, session);
    return { reply: await mockSendMessage(roomId, candidateText) };
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
async function generateScores(roomId, proctorViolations = [], tabSwitchCount = 0) {
  const session = await redis.getHash(roomId);
  if (!session) throw new Error("Session not found");

  if (session.mock) return mockGenerateScores();

  const conversationText = session.history
    .map(m => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.text}`)
    .join("\n");

  let proctorContext = "";
  if ((proctorViolations && proctorViolations.length > 0) || tabSwitchCount > 0) {
    proctorContext = `\nPROCTORING VIOLATIONS DETECTED during this session:
- Tab Switches: ${tabSwitchCount}
- Vision/Proctor Violations:
${(proctorViolations || []).map(v => `  • [${v.type}] ${v.details}`).join("\n")}

IMPORTANT: Factor these violations heavily into the scores. If they have repeated violations (like switching tabs or eye/face tracking violations indicating searching for answers or copy-pasting), decrease their "problemSolving" and "overall" score significantly and address this cheating behavior in the summary description.`;
  }

  const prompt = `You are evaluating a technical interview transcript. Provide scores (1–10) and a summary.

Transcript:
${conversationText.substring(0, 4000)}
${proctorContext}

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

async function getHistory(roomId) {
  const session = await redis.getHash(roomId);
  return session?.history || [];
}

async function destroySession(roomId) {
  await redis.deleteKey(roomId);
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
