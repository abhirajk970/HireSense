const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Interview = require("../models/Interview");
const Notification = require("../models/Notification");

const router = express.Router();

// ── Create an interviewer account (company only) ─────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, email, password, specialty, companyId } = req.body;
    if (!name || !email || !password || !companyId)
      return res.status(400).json({ msg: "name, email, password, companyId required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const interviewer = await User.create({
      name, email, password: hashed,
      role: "interviewer",
      companyId,
      specialty: specialty || "General"
    });

    res.status(201).json({
      msg: "Interviewer created",
      interviewer: { _id: interviewer._id, name, email, specialty: interviewer.specialty }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── List all interviewers for a company ──────────────────────────────────────
router.get("/company/:companyId", async (req, res) => {
  try {
    const interviewers = await User.find({
      role: "interviewer",
      companyId: req.params.companyId
    }).select("-password");

    const enriched = await Promise.all(
      interviewers.map(async (iv) => {
        const upcoming = await Interview.countDocuments({
          interviewerId: iv._id,
          status: "Scheduled",
          scheduledAt: { $gte: new Date() }
        });
        const completed = await Interview.countDocuments({
          interviewerId: iv._id,
          status: "Completed"
        });
        return { ...iv.toObject(), upcomingCount: upcoming, completedCount: completed };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete an interviewer ────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "Interviewer removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get all interviews for an interviewer ────────────────────────────────────
router.get("/:interviewerId/interviews", async (req, res) => {
  try {
    const interviews = await Interview.find({ interviewerId: req.params.interviewerId })
      .populate("candidateId", "name email skills")
      .populate("jobId", "title companyName")
      .sort({ scheduledAt: 1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reschedule an interview (interviewer or company) ─────────────────────────
router.put("/:roomId/reschedule", async (req, res) => {
  try {
    const { newScheduledAt, rescheduleReason } = req.body;
    if (!newScheduledAt) return res.status(400).json({ msg: "newScheduledAt required" });

    const interview = await Interview.findOne({ roomId: req.params.roomId })
      .populate("candidateId", "name email")
      .populate("jobId", "title");

    if (!interview) return res.status(404).json({ msg: "Interview not found" });

    interview.scheduledAt = new Date(newScheduledAt);
    // Reset reminder flags so they fire again at the new time
    interview.remindersSent = { twoHour: false, fiveMin: false };
    await interview.save();

    // In-app notification to candidate
    await Notification.create({
      userId: interview.candidateId._id,
      type: "interview_scheduled",
      title: "Interview Rescheduled",
      message: `Your ${interview.stageName} interview for "${interview.jobId.title}" has been moved to ${new Date(newScheduledAt).toLocaleString("en-IN")}.${rescheduleReason ? " Reason: " + rescheduleReason : ""}`,
      relatedJobId: interview.jobId._id
    });

    // Email via Ethereal (test)
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email", port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      const info = await transporter.sendMail({
        from: '"HireSense" <no-reply@hiresense.com>',
        to: interview.candidateId.email,
        subject: `Interview Rescheduled — ${interview.jobId.title}`,
        text: `Hi ${interview.candidateId.name},\n\nYour ${interview.stageName} interview has been rescheduled.\n\nNew time: ${new Date(newScheduledAt).toLocaleString("en-IN")}\n${rescheduleReason ? "Reason: " + rescheduleReason + "\n" : ""}\nPlease join via your HireSense dashboard.\n\nBest,\nHireSense Team`
      });
      console.log("[Reschedule] Email preview:", nodemailer.getTestMessageUrl(info));
    } catch (mailErr) {
      console.error("[Reschedule] Email error:", mailErr.message);
    }

    res.json({ msg: "Rescheduled successfully", interview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update interviewer notes / scores after interview ───────────────────────
router.put("/:roomId/complete", async (req, res) => {
  try {
    const { scores, interviewerNotes, status } = req.body;
    const updates = { status: status || "Completed" };
    if (scores) updates.scores = scores;
    if (interviewerNotes !== undefined) updates.interviewerNotes = interviewerNotes;

    const interview = await Interview.findOneAndUpdate(
      { roomId: req.params.roomId },
      { $set: updates },
      { new: true }
    );
    if (!interview) return res.status(404).json({ msg: "Interview not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
