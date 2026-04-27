const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  interviewMode: { type: String, enum: ["Human", "AI"], default: "Human" },
  stageName: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ["Scheduled", "Completed", "Cancelled", "Expired"], default: "Scheduled" },
  remindersSent: {
    twoHour: { type: Boolean, default: false },
    fiveMin: { type: Boolean, default: false }
  },
  interviewerNotes: { type: String, default: "" },
  scores: {
    communication: { type: Number, min: 0, max: 10, default: 0 },
    technical: { type: Number, min: 0, max: 10, default: 0 },
    problemSolving: { type: Number, min: 0, max: 10, default: 0 },
    overall: { type: Number, min: 0, max: 10, default: 0 }
  },
  candidateFeedback: { type: String, default: "" },
  roomId: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("Interview", interviewSchema);
