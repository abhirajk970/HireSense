const express  = require("express");
const http     = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const AIInterview     = require("./models/AIInterview");
const llm             = require("./services/llmService");
const proctor         = require("./services/proctorService");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// ─── REST routes ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "AI Interview Microservice Healthy", llm: process.env.OLLAMA_MODEL || "llama3" }));
app.use("/api/dsa", interviewRoutes);

// Legacy interview status/report endpoints (kept for backward compat)
app.get("/api/ai-interview/:roomId/status", async (req, res) => {
  try {
    const interview = await AIInterview.findOne({ roomId: req.params.roomId });
    if (!interview) return res.status(404).json({ msg: "Not found" });
    res.json({ status: interview.status, scheduledAt: interview.startedAt, interviewState: interview.interviewState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/ai-interview/:roomId/report", async (req, res) => {
  try {
    const interview = await AIInterview.findOne({ roomId: req.params.roomId });
    if (!interview) return res.status(404).json({ msg: "Not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ AI Interview DB Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// ─── HTTP + Socket.IO ─────────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── join-room: start the AI conversation interview (voice/chat mode) ────────
  socket.on("join-room", async (roomId, jobContext) => {
    socket.join(roomId);
    console.log(`[AI] Candidate joined room: ${roomId}`);

    try {
      let interview = await AIInterview.findOne({ roomId });
      if (!interview) {
        const isValidId = (id) => id && /^[a-fA-F0-9]{24}$/.test(id);
        const createData = { roomId, status: "InProgress", startedAt: new Date() };
        if (isValidId(jobContext?.jobId))         createData.jobId         = jobContext.jobId;
        if (isValidId(jobContext?.applicationId)) createData.applicationId = jobContext.applicationId;
        if (isValidId(jobContext?.candidateId))   createData.candidateId   = jobContext.candidateId;

        interview = await AIInterview.create(createData);
        console.log(`[AI] Interview record created: ${interview._id}`);
      } else if (interview.status === "Completed") {
        socket.emit("interview-blocked", "This interview has already been completed.");
        return;
      } else {
        interview.status     = "InProgress";
        interview.startedAt  = new Date();
        await interview.save();
      }

      proctor.initProctoring(roomId);

      const greeting = await llm.initSession(roomId, {
        jobTitle:    jobContext?.jobTitle    || "Software Engineer",
        companyName: jobContext?.companyName || "the company",
        stageName:   jobContext?.stageName   || "Technical",
        skills:      jobContext?.skills      || [],
        questions:   jobContext?.questions   || []
      });

      interview.conversationLog.push({ role: "ai", text: greeting });
      await interview.save();

      socket.emit("ai-message", greeting);
      console.log(`[AI] Greeting sent to candidate`);

    } catch (err) {
      console.error("[AI] Error starting interview:", err.message);
      socket.emit("ai-error", `Failed to start AI interview: ${err.message}`);
    }
  });

  // ── candidate-message: voice/text response ───────────────────────────────
  socket.on("candidate-message", async (roomId, text) => {
    try {
      const interview = await AIInterview.findOne({ roomId });
      if (interview) {
        interview.conversationLog.push({ role: "candidate", text });
        await interview.save();
      }

      const aiResponse = await llm.sendMessage(roomId, text);

      if (interview) {
        interview.conversationLog.push({ role: "ai", text: aiResponse });
        await interview.save();
      }

      if (aiResponse.includes("INTERVIEW_COMPLETE")) {
        const cleanResponse = aiResponse.replace("INTERVIEW_COMPLETE", "").trim();
        socket.emit("ai-message", cleanResponse);

        try {
          const scores = await llm.generateScores(roomId);
          if (interview) {
            interview.status      = "Completed";
            interview.completedAt = new Date();
            interview.scores      = {
              communication:   Math.round((scores.communication || 7) / 10 * 100),
              codeCorrectness: interview.scores?.codeCorrectness || 0,
              codeQuality:     Math.round((scores.technical      || 7) / 10 * 100),
              intuition:       interview.scores?.intuition        || 0,
              overall:         Math.round((scores.overall        || 7) / 10 * 100)
            };
            interview.aiSummary         = scores.summary;
            interview.proctorViolations = proctor.getViolations(roomId);
            await interview.save();
          }
          llm.destroySession(roomId);
          proctor.destroyProctoring(roomId);
        } catch (scoreErr) {
          console.error("[AI] Scoring error:", scoreErr.message);
        }

        socket.emit("interview-ended", { msg: "Interview complete. Thank you!" });
      } else {
        socket.emit("ai-message", aiResponse);
      }
    } catch (err) {
      console.error("[AI] Message error:", err.message);
      socket.emit("ai-error", "I had trouble processing that. Could you repeat?");
    }
  });

  // ── code-snapshot: editor sync ───────────────────────────────────────────
  socket.on("code-snapshot", async (roomId, code, language) => {
    try {
      const interview = await AIInterview.findOne({ roomId });
      if (interview) {
        interview.codeSnapshots.push({ code, language });
        await interview.save();
      }
    } catch (err) {
      console.error("[AI] Code snapshot error:", err.message);
    }
  });

  // ── proctor events ───────────────────────────────────────────────────────
  socket.on("proctor-violation", async (roomId, type, details) => {
    proctor.addViolation(roomId, type, details);
    try {
      const interview = await AIInterview.findOne({ roomId });
      if (interview) {
        interview.proctorViolations.push({ type, timestamp: new Date(), details });
        await interview.save();
      }
    } catch (err) {
      console.error("[AI] Proctor log error:", err.message);
    }
  });

  socket.on("tab-switch", async (roomId) => {
    proctor.addViolation(roomId, "tab_switch", "Candidate switched browser tab");
    try {
      await AIInterview.findOneAndUpdate({ roomId }, { $inc: { tabSwitchCount: 1 } });
    } catch (err) {
      console.error("[AI] Tab switch log error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5200;
server.listen(PORT, () => {
  console.log(`\n🚀 AI Interview Microservice running on http://localhost:${PORT}`);
  console.log(`🤖 LLM: ${process.env.OLLAMA_MODEL || "llama3"} @ ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`);
  console.log(`📚 DSA routes: http://localhost:${PORT}/api/dsa/\n`);
});
