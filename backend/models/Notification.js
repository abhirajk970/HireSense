const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { 
    type: String, 
    enum: ["shortlisted", "oa_scheduled", "oa_completed", "application_received", "status_change", "general", "interview_reminder", "interview_scheduled"],
    default: "general"
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedJobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
