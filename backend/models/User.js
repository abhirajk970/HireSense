const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["candidate", "company"], required: true },
  
  // Candidate specific fields
  resumeUrl: { type: String, default: "" },
  skills: [{ type: String }],
  experience: { type: Number, default: 0 },
  cgpa: { type: Number, default: 0 },
  instituteName: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  github: { type: String, default: "" },
  fieldsOfInterest: [{ type: String }],
  expectedSalary: { type: Number, default: 0 },
  location: { type: String, default: "" },
  
  // Company specific fields
  companyName: { type: String, default: "" },
  description: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);