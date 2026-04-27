const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  resumePath: { type: String, required: true },
  resumeScore: { type: Number, default: 0 },
  matchScore: { type: Number, default: 0 },
  testScore: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ["Applied", "Testing", "Interview", "Rejected", "Hired"],
    default: "Applied" 
  },
  oaStatus: {
    type: String,
    enum: ["Not Scheduled", "Scheduled", "Completed"],
    default: "Not Scheduled"
  },
  oaWindowStart: { type: Date },
  oaWindowEnd: { type: Date },
  oaScore: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Application", applicationSchema);