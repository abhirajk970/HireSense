const mongoose = require("mongoose");

const solvedQuestionSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  solvedAt: { type: Date, default: Date.now },
  language: { type: String, default: "javascript" }
});

solvedQuestionSchema.index({ candidateId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("SolvedQuestion", solvedQuestionSchema);
