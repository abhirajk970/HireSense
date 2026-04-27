const express = require("express");
const Application = require("../models/Application");
const User = require("../models/User");
const Job = require("../models/Job");
const Notification = require("../models/Notification");
const upload = require("../middleware/upload");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const nodemailer = require("nodemailer");

const router = express.Router();

// Upload Resume & Apply
router.post("/apply", upload.single("resume"), async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    
    // Check if application already exists
    const existingApp = await Application.findOne({ candidateId, jobId });
    if (existingApp) {
        return res.status(400).json({ msg: "You have already applied for this job." });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    // Validate deadline server-side
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
        return res.status(400).json({ msg: "The application deadline for this job has passed." });
    }

    // Ensure candidate exists and save resume path
    let candidate = await User.findById(candidateId);
    let filePath = "";
    
    if (req.file) {
      filePath = req.file.path;
      candidate.resumeUrl = filePath;
      await candidate.save();
    } else if (candidate.resumeUrl) {
      filePath = candidate.resumeUrl;
    } else {
      return res.status(400).json({ msg: "Please upload a resume." });
    }

    // Send resume to AI service
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    if (job.description) {
        form.append("job_description", job.description);
    }

    const response = await axios.post(
      "http://127.0.0.1:8000/parse-resume",
      form,
      { headers: form.getHeaders() }
    );

    const { detected_skills, years_experience, cgpa, semantic_match_score } = response.data;
    
    // Update candidate profile with new extracted data (optional but good for tracking)
    candidate.skills = detected_skills;
    candidate.experience = years_experience;
    candidate.cgpa = cgpa;
    await candidate.save();

    // ML Matching logic (Blending Skill Keywords and Semantic Cosine Similarity)
    const requiredSkills = job.requiredSkills || [];
    const matchedSkills = requiredSkills.filter(skill => detected_skills.some(d_skill => d_skill.toLowerCase() === skill.toLowerCase()));
    
    let skillsScore = 0;
    if (requiredSkills.length > 0) {
        skillsScore = (matchedSkills.length / requiredSkills.length) * 100;
    } else {
        skillsScore = 100; // No specific skills required
    }

    // Blend: 70% exact skills match + 30% semantic meaning match
    let finalMatchScore = (skillsScore * 0.7) + ((semantic_match_score || 0) * 0.3);

    // Simple logic: boost match score if experience matches/exceeds Job requirements
    if (job.experienceRequired && years_experience >= job.experienceRequired) {
        finalMatchScore = Math.min(100, finalMatchScore + 10);
    }

    const application = await Application.create({
      candidateId,
      jobId,
      resumePath: filePath,
      matchScore: Math.round(finalMatchScore)
    });

    // Notify the company that a new application was received
    try {
      const jobForNotif = await Job.findById(jobId).populate('createdBy');
      if (jobForNotif?.createdBy?._id) {
        await Notification.create({
          userId: jobForNotif.createdBy._id,
          type: "application_received",
          title: "New Application Received",
          message: `A candidate applied for ${jobForNotif.title} with a ${Math.round(finalMatchScore)}% match score.`,
          relatedJobId: jobId
        });
      }
    } catch(notifErr) { console.error("Notification error:", notifErr.message); }

    res.status(201).json({
      matchScore: Math.round(finalMatchScore),
      matchedSkills,
      application
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Submit Test Score
router.post("/:id/test-score", async (req, res) => {
  try {
    const { score } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id, 
      { testScore: score, status: "Testing" }, 
      { new: true }
    );
    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Application Status
router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(app);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Sync OA Final Score
router.put("/:id/oa-score", async (req, res) => {
    try {
        const app = await Application.findByIdAndUpdate(req.params.id, {
            oaScore: req.body.oaScore,
            oaStatus: "Completed",
            ...(req.body.oaScore >= 50 ? { status: "Interview" } : {})
        }, { new: true }).populate("jobId");

        // Notify candidate about OA completion
        try {
          await Notification.create({
            userId: app.candidateId,
            type: "oa_completed",
            title: "Assessment Results Available",
            message: `Your DSA Assessment for ${app.jobId?.title || 'a position'} has been graded. Score: ${req.body.oaScore}%.`,
            relatedJobId: app.jobId?._id
          });
        } catch(notifErr) { console.error("Notification error:", notifErr.message); }

        res.json(app);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Shortlist for DSA Assessment
router.post("/:id/shortlist", async (req, res) => {
    try {
        const app = await Application.findById(req.params.id)
            .populate("jobId")
            .populate("candidateId");
            
        if (!app) return res.status(404).json({ msg: "Application not found" });

        const job = app.jobId;
        
        let oaStart = new Date();
        let oaEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
        
        // Find if an explicitly defined OA stage exists in the new pipeline structure
        const oaStage = job.stages && job.stages.find(s => s.name.toLowerCase().includes('oa') || s.name.toLowerCase().includes('assessment'));
        if (oaStage && oaStage.startDate) {
            oaStart = oaStage.startDate;
            oaEnd = oaStage.endDate || new Date(new Date(oaStart).getTime() + 7 * 24 * 60 * 60 * 1000);
        }

        app.oaStatus = "Scheduled";
        app.oaWindowStart = oaStart;
        app.oaWindowEnd = oaEnd;
        app.status = "Testing";
        
        await app.save();

        // Notify candidate about shortlisting
        try {
          await Notification.create({
            userId: app.candidateId._id,
            type: "oa_scheduled",
            title: "Shortlisted for DSA Assessment!",
            message: `You've been shortlisted for the DSA Assessment for ${job.title}. Your window: ${new Date(app.oaWindowStart).toLocaleString()} - ${new Date(app.oaWindowEnd).toLocaleString()}.`,
            relatedJobId: job._id
          });
        } catch(notifErr) { console.error("Notification error:", notifErr.message); }

        // Send Email
        let testAccount = await nodemailer.createTestAccount();
        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, 
            auth: {
                user: testAccount.user, 
                pass: testAccount.pass, 
            },
        });

        let info = await transporter.sendMail({
            from: '"HireSense Platform" <no-reply@hiresense.com>',
            to: app.candidateId.email,
            subject: `Shortlisted for DSA Assessment - ${job.title}`,
            text: `Congratulations! You have been shortlisted for the DSA Assessment for the ${job.title} position.\n\nYour assessment window is from ${new Date(app.oaWindowStart).toLocaleString()} to ${new Date(app.oaWindowEnd).toLocaleString()}.\n\nPlease login to your Candidate Dashboard to take the assessment during this window.`
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        res.json({ app, previewUrl: nodemailer.getTestMessageUrl(info) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get candidate applications
router.get("/candidate/:id", async (req, res) => {
  try {
    const apps = await Application.find({ candidateId: req.params.id })
        .populate("jobId", "title description location")
        .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get applications for a company's jobs
router.get("/company/:companyId", async (req, res) => {
  try {
    // Find all jobs created by this company
    const jobs = await Job.find({ createdBy: req.params.companyId }).select('_id');
    const jobIds = jobs.map(job => job._id);

    // Find applications for these jobs
    const apps = await Application.find({ jobId: { $in: jobIds } })
      .populate("candidateId", "name email skills experience cgpa")
      .populate("jobId", "title")
      .sort({ matchScore: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;