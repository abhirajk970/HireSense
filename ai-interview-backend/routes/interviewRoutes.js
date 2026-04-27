/**
 * interviewRoutes.js — 7 REST routes for the DSA interview engine
 *
 * POST /api/dsa/start-interview      → pick question, init state machine
 * POST /api/dsa/submit-intuition     → LLM evaluates approach
 * POST /api/dsa/request-hint         → progressive hint + penalty
 * POST /api/dsa/submit-code          → store code snapshot
 * POST /api/dsa/run-code             → execute + test cases
 * POST /api/dsa/submit-explanation   → LLM follow-up questions
 * GET  /api/dsa/feedback/:roomId     → full structured report
 */

const router  = require("express").Router();
const engine  = require("../services/interviewEngine");
const AIInterview = require("../models/AIInterview");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok(res, data)        { return res.json({ success: true, ...data }); }
function fail(res, msg, code = 400) { return res.status(code).json({ success: false, error: msg }); }

async function withInterview(req, res, fn) {
  try {
    await fn();
  } catch (err) {
    console.error(`[Routes] ${req.path}:`, err.message);
    return fail(res, err.message, 500);
  }
}

// ─── POST /api/dsa/start-interview ───────────────────────────────────────────

router.post("/start-interview", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return fail(res, "roomId is required");

  await withInterview(req, res, async () => {
    const result = await engine.startDSAInterview(roomId);
    return ok(res, result);
  });
});

// ─── POST /api/dsa/submit-intuition ──────────────────────────────────────────

router.post("/submit-intuition", async (req, res) => {
  const { roomId, text } = req.body;
  if (!roomId || !text) return fail(res, "roomId and text are required");

  await withInterview(req, res, async () => {
    const result = await engine.submitIntuition(roomId, text);
    return ok(res, result);
  });
});

// ─── POST /api/dsa/request-hint ──────────────────────────────────────────────

router.post("/request-hint", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return fail(res, "roomId is required");

  await withInterview(req, res, async () => {
    const result = await engine.requestHint(roomId);
    return ok(res, result);
  });
});

// ─── POST /api/dsa/submit-code ───────────────────────────────────────────────
// Store code without running (lightweight snapshot)

router.post("/submit-code", async (req, res) => {
  const { roomId, code, language = "javascript" } = req.body;
  if (!roomId || !code) return fail(res, "roomId and code are required");

  await withInterview(req, res, async () => {
    const interview = await AIInterview.findOne({ roomId });
    if (!interview) return fail(res, "Interview not found", 404);

    interview.submittedCode = code;
    interview.codeLanguage  = language;
    interview.codeSnapshots.push({ code, language });
    if (interview.interviewState === "INTUITION_APPROVED") {
      interview.interviewState = "CODE_WRITTEN";
    }
    await interview.save();

    return ok(res, {
      message: "Code saved successfully.",
      state:   interview.interviewState
    });
  });
});

// ─── POST /api/dsa/run-code ──────────────────────────────────────────────────

router.post("/run-code", async (req, res) => {
  const { roomId, code, language = "javascript" } = req.body;
  if (!roomId || !code) return fail(res, "roomId and code are required");

  await withInterview(req, res, async () => {
    const result = await engine.runCandidateCode(roomId, code, language);
    return ok(res, result);
  });
});

// ─── POST /api/dsa/submit-explanation ────────────────────────────────────────

router.post("/submit-explanation", async (req, res) => {
  const { roomId, text } = req.body;
  if (!roomId || !text) return fail(res, "roomId and text are required");

  await withInterview(req, res, async () => {
    const result = await engine.submitExplanation(roomId, text);
    return ok(res, result);
  });
});

// ─── GET /api/dsa/feedback/:roomId ───────────────────────────────────────────

router.get("/feedback/:roomId", async (req, res) => {
  const { roomId } = req.params;

  await withInterview(req, res, async () => {
    const result = await engine.generateFinalFeedback(roomId);
    return ok(res, result);
  });
});

// ─── GET /api/dsa/status/:roomId ─────────────────────────────────────────────
// Lightweight status check (no LLM call)

router.get("/status/:roomId", async (req, res) => {
  await withInterview(req, res, async () => {
    const interview = await AIInterview.findOne({ roomId: req.params.roomId })
      .select("roomId interviewState status hintLevel testResults scores startedAt completedAt");
    if (!interview) return fail(res, "Interview not found", 404);
    return ok(res, { interview });
  });
});

module.exports = router;
