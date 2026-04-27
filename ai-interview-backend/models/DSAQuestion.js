const mongoose = require("mongoose");

const dsaQuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  tags: [{ type: String }],

  // 4-level progressive hints (index 0 = level 1, index 3 = level 4)
  hints: {
    type: [String],
    validate: {
      validator: (arr) => arr.length <= 4,
      message: "Maximum 4 hints allowed"
    }
  },

  // Test cases for deterministic evaluation
  testCases: [{
    input: { type: String, required: true },       // e.g. "[2,7,11,15], 9"
    expectedOutput: { type: String, required: true }, // e.g. "[0,1]"
    isHidden: { type: Boolean, default: false },
    description: { type: String, default: "" }
  }],

  // Wrapper code that calls the candidate's function with each test input
  // %CODE% is replaced by candidate's submission at runtime
  functionWrapper: { type: String, default: "" },
  functionName: { type: String, default: "solution" },

  referenceComplexity: {
    time: { type: String, default: "O(n)" },
    space: { type: String, default: "O(n)" }
  },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("DSAQuestion", dsaQuestionSchema);
