const express  = require("express");
const http     = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const AIInterview     = require("./models/AIInterview");
const DSAQuestion     = require("./models/DSAQuestion");
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
    const { roomId } = req.params;
    let interview = await AIInterview.findOne({ roomId });

    // Clear completed demo sessions to allow taking multiple sandbox runs
    if (interview && interview.status === "Completed" && (roomId.includes("llama") || roomId.includes("demo"))) {
      await AIInterview.deleteOne({ roomId });
      interview = null;
      console.log(`[AI Status] Completed demo room ${roomId} cleared for a fresh sandbox run`);
    }

    if (!interview) {
      return res.json({ status: "Scheduled", interviewState: "INIT" });
    }

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

// Configure Socket.io Redis Adapter
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("🔌 Socket.io Redis Adapter connected");
  })
  .catch(err => {
    console.error("❌ Socket.io Redis Adapter connection failed:", err.message);
  });

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── join-room: start the AI conversation interview (voice/chat mode) ────────
  socket.on("join-room", async (roomId, jobContext) => {
    socket.join(roomId);
    console.log(`[AI] Candidate joined room: ${roomId}`);

    try {
      let interview = await AIInterview.findOne({ roomId });

      // If it is a completed demo room, clear it so we can start fresh!
      if (interview && interview.status === "Completed" && (roomId.includes("llama") || roomId.includes("demo"))) {
        await AIInterview.deleteOne({ roomId });
        interview = null;
        console.log(`[AI] Completed demo room ${roomId} cleared for a fresh sandbox run`);
      }

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
        if (!interview.startedAt) {
          interview.startedAt  = new Date();
        }
        await interview.save();
      }

      proctor.initProctoring(roomId);

      const isReconnect = interview && interview.conversationLog && interview.conversationLog.length > 0;
      if (isReconnect) {
        // Warm resume
        const lastAiMsg = interview.conversationLog.slice().reverse().find(l => l.role === "ai")?.text || "";
        const greeting = `Welcome back! I noticed we had a brief connection interruption, but don't worry, your progress is fully preserved. Let's resume right where we left off. ${lastAiMsg}`;
        
        await llm.initSession(roomId, {
          jobTitle:    jobContext?.jobTitle    || "Software Engineer",
          companyName: jobContext?.companyName || "the company",
          stageName:   jobContext?.stageName   || "Technical",
          skills:      jobContext?.skills      || [],
          questions:   jobContext?.questions   || []
        }, interview.conversationLog, interview.startedAt);
        
        socket.emit("ai-message", greeting);

        // Fetch and sync DSA question state if active
        if (interview.questionId) {
          try {
            const dsaQ = await DSAQuestion.findById(interview.questionId);
            if (dsaQ) {
              const latestCode = interview.submittedCode || (interview.codeSnapshots && interview.codeSnapshots.length > 0 ? interview.codeSnapshots[interview.codeSnapshots.length - 1].code : "");
              socket.emit("reconnect-sync", {
                interviewState: interview.interviewState,
                question: {
                  id: dsaQ._id,
                  title: dsaQ.title,
                  difficulty: dsaQ.difficulty,
                  description: dsaQ.description,
                  functionName: dsaQ.functionName || "solution"
                },
                code: latestCode,
                language: interview.codeLanguage || "javascript",
                hintLevel: interview.hintLevel || 0,
                hintPenalty: interview.hintPenalty || 0
              });
            }
          } catch (dsaErr) {
            console.error("[AI] Reconnect fetch question error:", dsaErr.message);
          }
        }
        
        console.log(`[AI] Reconnection detected. Resumption prompt and state sync sent to candidate`);
        return;
      }

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
      const result = await llm.sendMessage(roomId, text, 
        (phase, data) => {
          if (phase === "DSA") {
            socket.emit("show-dsa-question", data);
          }
        }
      );

      const { reply: aiResponse, stageAction } = result;

      // Emit stage events if the AI decided to advance or trigger a DSA action
      if (stageAction) {
        if (stageAction.type === 'ADVANCE_STAGE') {
          socket.emit('stage-advance', stageAction.payload);
        } else if (stageAction.type === 'DSA_ACTION') {
          socket.emit('dsa-action', stageAction.payload);
        } else if (stageAction.type === 'LP_QUESTION') {
          socket.emit('lp-progress', stageAction.payload);
        }
      }

      const interview = await AIInterview.findOne({ roomId });

      if (aiResponse.includes("INTERVIEW_COMPLETE")) {
        const cleanResponse = aiResponse.replace("INTERVIEW_COMPLETE", "").trim();
        socket.emit("ai-message", cleanResponse);
        socket.emit("interview-ended", { msg: "Interview complete. Thank you!" });

        // Update database status immediately
        if (interview) {
          interview.status      = "Completed";
          interview.completedAt = new Date();
          await interview.save();
        }

        // Generate scores asynchronously in the background
        llm.generateScores(roomId, interview ? interview.proctorViolations : [], interview ? interview.tabSwitchCount : 0)
          .then(async (scores) => {
            const updated = await AIInterview.findOne({ roomId });
            if (updated) {
              updated.scores = {
                communication:   Math.round((scores.communication || 7) / 10 * 100),
                codeCorrectness: updated.scores?.codeCorrectness || 0,
                codeQuality:     Math.round((scores.technical      || 7) / 10 * 100),
                intuition:       updated.scores?.intuition        || 0,
                overall:         Math.round((scores.overall        || 7) / 10 * 100)
              };
              updated.aiSummary = scores.summary;
              updated.proctorViolations = proctor.getViolations(roomId);
              await updated.save();
            }
            llm.destroySession(roomId);
            proctor.destroyProctoring(roomId);
          })
          .catch((scoreErr) => {
            console.error("[AI] Background completion scoring error:", scoreErr.message);
            llm.destroySession(roomId);
            proctor.destroyProctoring(roomId);
          });
      } else {
        socket.emit("ai-message", aiResponse);
      }
    } catch (err) {
      console.error("[AI] Message error:", err.message);
      socket.emit("ai-error", "I had trouble processing that. Could you repeat?");
    }
  });

  // ── end-interview: explicit trigger from candidate ───────────────────────
  socket.on("end-interview", async (roomId) => {
    try {
      socket.emit("ai-message", "Thank you for your time. The interview is now complete.");
      socket.emit("interview-ended", { msg: "Interview complete. Thank you!" });

      const interview = await AIInterview.findOne({ roomId });
      if (interview) {
        interview.status      = "Completed";
        interview.completedAt = new Date();
        await interview.save();
      }

      // Generate scores asynchronously in the background
      llm.generateScores(roomId, interview ? interview.proctorViolations : [], interview ? interview.tabSwitchCount : 0)
        .then(async (scores) => {
          const updated = await AIInterview.findOne({ roomId });
          if (updated) {
            updated.scores = {
              communication:   Math.round((scores.communication || 7) / 10 * 100),
              codeCorrectness: updated.scores?.codeCorrectness || 0,
              codeQuality:     Math.round((scores.technical      || 7) / 10 * 100),
              intuition:       updated.scores?.intuition        || 0,
              overall:         Math.round((scores.overall        || 7) / 10 * 100)
            };
            updated.aiSummary = scores.summary;
            updated.proctorViolations = proctor.getViolations(roomId);
            await updated.save();
          }
          llm.destroySession(roomId);
          proctor.destroyProctoring(roomId);
        })
        .catch((scoreErr) => {
          console.error("[AI] Background end scoring error:", scoreErr.message);
          llm.destroySession(roomId);
          proctor.destroyProctoring(roomId);
        });

    } catch (err) {
      console.error("[Socket] End interview error:", err.message);
      socket.emit("ai-error", err.message);
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

// ─── Start Code Runner Worker ─────────────────────────────────────────────────
const { startCodeRunnerWorker } = require("./workers/codeRunnerWorker");
startCodeRunnerWorker(io).catch(err => {
  console.error("❌ Failed to start Kafka Code Runner Worker:", err.message);
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5200;
server.listen(PORT, () => {
  console.log(`\n🚀 AI Interview Microservice running on http://localhost:${PORT}`);
  console.log(`🤖 LLM: ${process.env.OLLAMA_MODEL || "llama3"} @ ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`);
  console.log(`📚 DSA routes: http://localhost:${PORT}/api/dsa/\n`);
});
