const express = require("express");
const Job = require("../models/Job");
const upload = require("../middleware/upload");

const router = express.Router();

// Upload Assignment PDF
router.post("/upload-assignment", upload.single("file"), async (req, res) => {
  try {
      if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
      res.json({ url: req.file.path.replace(/\\/g, "/") });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Create Job
router.post("/", async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Jobs — with optional candidate mode filtering
router.get("/", async (req, res) => {
  try {
    const { search, location, jobType, minExperience, mode } = req.query;
    let query = {};

    if (search) {
       query.$or = [
         { title: { $regex: search, $options: "i" } },
         { requiredSkills: { $regex: search, $options: "i" } }
       ];
    }
    if (location && location !== "All") query.location = location;
    if (jobType && jobType !== "All") query.jobType = jobType;
    if (minExperience) query.experienceRequired = { $lte: Number(minExperience) };

    // Candidate mode: hide closed jobs AND jobs past application deadline
    if (mode === "candidate") {
      query.processStatus = { $ne: "Closed" };
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { applicationDeadline: null },
          { applicationDeadline: { $exists: false } },
          { applicationDeadline: { $gte: new Date() } }
        ]
      });
    }

    const jobs = await Job.find(query).populate("createdBy", "companyName email").sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Test for a specific job
router.get("/:jobId/test", async (req, res) => {
  try {
    const test = await Test.findOne({ jobId: req.params.jobId });
    if (!test) return res.status(404).json({ msg: "Test not found for this job" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific job
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("createdBy", "companyName description");
    if (!job) return res.status(404).json({ msg: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update stages — replace entirely
router.put("/:id/stages", async (req, res) => {
  try {
    const { stages, applicationDeadline } = req.body;
    const updates = {};
    if (stages) updates.stages = stages;
    if (applicationDeadline !== undefined) updates.applicationDeadline = applicationDeadline || null;

    const job = await Job.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!job) return res.status(404).json({ msg: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Close a job (soft-delete)
router.put("/:id/close", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { processStatus: "Closed" }, { new: true });
    if (!job) return res.status(404).json({ msg: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reopen a closed job
router.put("/:id/reopen", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { processStatus: "Active" }, { new: true });
    if (!job) return res.status(404).json({ msg: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hard-delete a job (permanent) + cascade cleanup
router.delete("/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ msg: "Job not found" });
    // Cascade: remove associated test, applications, interviews, notifications
    await Test.deleteOne({ jobId: req.params.id });
    const Application = require("../models/Application");
    const Interview = require("../models/Interview");
    const Notification = require("../models/Notification");
    await Application.deleteMany({ jobId: req.params.id });
    await Interview.deleteMany({ jobId: req.params.id });
    await Notification.deleteMany({ relatedJobId: req.params.id });
    res.json({ msg: "Job and all associated data deleted permanently" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update process status (Stop hiring process) — legacy
router.put("/:id/stop-process", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { processStatus: "Stopped" }, { new: true });
    if (!job) return res.status(404).json({ msg: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;