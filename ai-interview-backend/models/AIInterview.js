const mongoose = require("mongoose");

const aiInterviewSchema = new mongoose.Schema({
  // Context refs
  jobId:         { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
  candidateId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  roomId:        { type: String, required: true, unique: true },

  // ── State Machine ──────────────────────────────────────────────────
  interviewState: {
    type: String,
    enum: [
      "INIT",
      "QUESTION_GIVEN",
      "INTUITION_EXPLAINED",
      "INTUITION_APPROVED",
      "CODE_WRITTEN",
      "CODE_EVALUATED",
      "CODE_EXPLAINED",
      "FOLLOW_UP",
      "FINAL_FEEDBACK"
    ],
    default: "INIT"
  },

  // Current question being worked on
  currentQuestionIndex: { type: Number, default: 0 },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "DSAQuestion" },

  // ── Hint system ────────────────────────────────────────────────────
  hintLevel:    { type: Number, default: 0, min: 0, max: 4 },
  hintPenalty:  { type: Number, default: 0 },

  // ── Code execution ─────────────────────────────────────────────────
  submittedCode: { type: String, default: "" },
  codeLanguage:  { type: String, default: "javascript" },
  testResults: {
    passed:   { type: Number, default: 0 },
    total:    { type: Number, default: 0 },
    errors:   [{ type: String }],
    timeTaken: { type: Number, default: 0 }
  },

  // ── Scoring ────────────────────────────────────────────────────────
  scores: {
    intuition:       { type: Number, default: 0, min: 0, max: 100 },
    codeCorrectness: { type: Number, default: 0, min: 0, max: 100 },
    codeQuality:     { type: Number, default: 0, min: 0, max: 100 },
    communication:   { type: Number, default: 0, min: 0, max: 100 },
    overall:         { type: Number, default: 0, min: 0, max: 100 }
  },
  aiSummary: { type: String, default: "" },

  // ── Session metadata ───────────────────────────────────────────────
  status: {
    type: String,
    enum: ["Scheduled", "InProgress", "Completed", "Expired"],
    default: "Scheduled"
  },

  // ── Conversation log ───────────────────────────────────────────────
  conversationLog: [{
    role:      { type: String, enum: ["ai", "candidate"] },
    text:      String,
    timestamp: { type: Date, default: Date.now }
  }],

  // ── Code snapshots (editor sync) ───────────────────────────────────
  codeSnapshots: [{
    code:      String,
    language:  String,
    timestamp: { type: Date, default: Date.now }
  }],

  // ── Proctoring ─────────────────────────────────────────────────────
  proctorViolations: [{
    type:      { type: String },
    timestamp: { type: Date, default: Date.now },
    details:   String
  }],
  tabSwitchCount: { type: Number, default: 0 },

  startedAt:   Date,
  completedAt: Date

}, { timestamps: true });

module.exports = mongoose.model("AIInterview", aiInterviewSchema);
