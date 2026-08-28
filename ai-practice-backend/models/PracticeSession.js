const mongoose = require("mongoose");

const practiceSessionSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  discipline: { type: String, required: true }, // e.g. Frontend, Backend, Behavioral
  messages: [
    {
      role: { type: String, enum: ["ai", "candidate"], required: true },
      text: { type: String, required: true },
      time: { type: Date, default: Date.now }
    }
  ],
  isCompleted: { type: Boolean, default: false },
  scores: {
    score: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
    improvements: [{ type: String }]
  }
}, { timestamps: true });

module.exports = mongoose.model("PracticeSession", practiceSessionSchema);
