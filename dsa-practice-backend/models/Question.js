const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, default: "Easy" },
  topicTags: [{ type: String }],
  companyTags: [{ type: String }],
  acceptance: { type: Number, default: 50 },
  templates: {
    javascript: { type: String, default: "" },
    python: { type: String, default: "" },
    cpp: { type: String, default: "" },
    c: { type: String, default: "" },
    java: { type: String, default: "" }
  },
  driverCode: {
    javascript: { type: String, default: "" },
    python: { type: String, default: "" },
    cpp: { type: String, default: "" },
    c: { type: String, default: "" },
    java: { type: String, default: "" }
  },
  testCases: [
    {
      input: { type: String, required: true },
      expectedOutput: { type: String, required: true },
      isHidden: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
