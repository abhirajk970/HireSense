const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ["In Progress", "Submitted", "Terminated"], default: "In Progress" },
  score: { type: Number, default: 0 },
  proctorScore: { type: Number, default: 100 },
  finalWeightedScore: { type: Number, default: 0 },
  proctoringLogs: [
    {
       event: { type: String }, // e.g., 'Tab Switch', 'Fullscreen Exit'
       timestamp: { type: Date, default: Date.now }
    }
  ],
  codeSubmissions: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      code: { type: String },
      language: { type: String },
      passedAll: { type: Boolean },
      score: { type: Number }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Assessment", assessmentSchema);
