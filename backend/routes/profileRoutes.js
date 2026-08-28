const express  = require("express");
const bcrypt   = require("bcryptjs");
const User     = require("../models/User");
const upload   = require("../middleware/upload");
const axios    = require("axios");
const fs       = require("fs");
const FormData = require("form-data");
const multer   = require("multer");
const path     = require("path");

const router = express.Router();

// ── Avatar upload storage ─────────────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/avatars";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

// ── GET profile ───────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT update profile details ────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };

    // Never allow updating sensitive fields via this route
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates._id;

    // Parse comma-separated arrays
    if (typeof updates.skills === "string")
      updates.skills = updates.skills.split(",").map(s => s.trim()).filter(Boolean);
    if (typeof updates.fieldsOfInterest === "string")
      updates.fieldsOfInterest = updates.fieldsOfInterest.split(",").map(s => s.trim()).filter(Boolean);

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ msg: "User not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT change password ───────────────────────────────────────────────────────
router.put("/:id/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ msg: "Both current and new passwords are required." });

    if (newPassword.length < 8)
      return res.status(400).json({ msg: "New password must be at least 8 characters." });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ msg: "Current password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ msg: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT change email ──────────────────────────────────────────────────────────
router.put("/:id/change-email", async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword)
      return res.status(400).json({ msg: "Email and current password are required." });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Verify password before changing email
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ msg: "Current password is incorrect." });

    // Check email uniqueness
    const existing = await User.findOne({ email: newEmail, _id: { $ne: req.params.id } });
    if (existing) return res.status(409).json({ msg: "Email already in use by another account." });

    user.email = newEmail;
    await user.save();

    res.json({ msg: "Email updated successfully.", newEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST upload avatar ────────────────────────────────────────────────────────
router.post("/:id/avatar", avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No image provided." });

    const avatarUrl = `http://localhost:5000/${req.file.path.replace(/\\/g, "/")}`;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatarUrl },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "Avatar updated.", avatarUrl, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT notification preferences ─────────────────────────────────────────────
router.put("/:id/notifications", async (req, res) => {
  try {
    const { notifEmail, notifInApp, notifInterview, notifNewsletter } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { notifEmail, notifInApp, notifInterview, notifNewsletter } },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "Notification preferences saved.", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST upload resume (candidate only) ───────────────────────────────────────
router.post("/:id/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "Please upload a valid resume." });

    let candidate = await User.findById(req.params.id);
    if (!candidate) return res.status(404).json({ msg: "User not found" });

    const filePath = req.file.path;
    candidate.resumeUrl = filePath;

    // Parse with AI service
    try {
      const form = new FormData();
      form.append("file", fs.createReadStream(filePath));
      const response = await axios.post("http://127.0.0.1:8000/parse-resume", form, { headers: form.getHeaders() });
      const { detected_skills, years_experience, cgpa, organizations, locations } = response.data;

      candidate.skills = [...new Set([...candidate.skills, ...detected_skills])];
      if (years_experience > candidate.experience) candidate.experience = years_experience;
      if (cgpa > candidate.cgpa) candidate.cgpa = cgpa;
      if (organizations?.length && !candidate.instituteName) candidate.instituteName = organizations[0];
      if (locations?.length && !candidate.location) candidate.location = locations[0];

      await candidate.save();
      return res.json({
        msg: "Resume uploaded and AI-parsed.",
        extractedData: { skills: detected_skills, experience: years_experience, cgpa, organizations, locations }
      });
    } catch {
      // AI service unavailable — still save the resume path
      await candidate.save();
      return res.json({ msg: "Resume uploaded. AI parsing unavailable.", extractedData: null });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE account ────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ msg: "Incorrect password." });

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "Account deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
