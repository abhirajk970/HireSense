const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: [{ type: String }],
  experienceRequired: { type: Number, default: 0 },
  location: { type: String, default: "Remote" },
  jobType: { type: String, enum: ["Full-time", "Part-time", "Contract", "Internship"], default: "Full-time" },
  salaryRange: { type: String, default: "Not Disclosed" },
  numberOfOpenings: { type: Number, default: 1 },
  applicationDeadline: { type: Date },
  stages: [{
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    advanceMode: { type: String, enum: ["Manual", "Auto"], default: "Manual" },
    advanceTopK: { type: Number, default: 0 },
    interviewType: { type: String, enum: ["None", "Human", "AI"], default: "None" }
  }],
  interviewQuestionSet: [{
    questionText: String,
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    expectedTopics: [String]
  }],
  processStatus: { type: String, enum: ["Active", "Closed", "Stopped"], default: "Active" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);