const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Test", testSchema);
