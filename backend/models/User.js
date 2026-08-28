const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["candidate", "company", "interviewer"], required: true },
  phone:    { type: String, default: "" },
  bio:      { type: String, default: "" },
  avatarUrl:{ type: String, default: "" },

  // Notification preferences
  notifEmail:      { type: Boolean, default: true },
  notifInApp:      { type: Boolean, default: true },
  notifInterview:  { type: Boolean, default: true },
  notifNewsletter: { type: Boolean, default: false },

  // Account status
  accountStatus: { type: String, enum: ["active","deactivated"], default: "active" },

  // Candidate fields
  resumeUrl:        { type: String, default: "" },
  skills:           [{ type: String }],
  experience:       { type: Number, default: 0 },
  cgpa:             { type: Number, default: 0 },
  instituteName:    { type: String, default: "" },
  linkedin:         { type: String, default: "" },
  github:           { type: String, default: "" },
  portfolio:        { type: String, default: "" },
  fieldsOfInterest: [{ type: String }],
  expectedSalary:   { type: Number, default: 0 },
  location:         { type: String, default: "" },
  openToWork:       { type: Boolean, default: true },

  // Company fields
  companyName:  { type: String, default: "" },
  description:  { type: String, default: "" },
  website:      { type: String, default: "" },
  industry:     { type: String, default: "" },
  companySize:  { type: String, default: "" },
  founded:      { type: String, default: "" },

  // Interviewer fields
  companyId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  specialty:  { type: String, default: "General" },
  timezone:   { type: String, default: "Asia/Kolkata" },
  workStart:  { type: String, default: "09:00" },
  workEnd:    { type: String, default: "18:00" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);