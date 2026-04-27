const express = require("express");
const User = require("../models/User");
const upload = require("../middleware/upload");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const router = express.Router();

// Get Candidate Profile
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    // Return relevant fields
    res.json({
        name: user.name,
        email: user.email,
        resumeUrl: user.resumeUrl,
        skills: user.skills,
        experience: user.experience,
        cgpa: user.cgpa,
        instituteName: user.instituteName,
        linkedin: user.linkedin,
        github: user.github,
        fieldsOfInterest: user.fieldsOfInterest,
        expectedSalary: user.expectedSalary,
        location: user.location,
        companyName: user.companyName,
        description: user.description
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile Details (Manual Entry)
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    
    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.role;
    
    // Parse skills and fields of interest if they come as strings
    if (typeof updates.skills === "string") {
        updates.skills = updates.skills.split(",").map(s => s.trim()).filter(s => s);
    }
    if (typeof updates.fieldsOfInterest === "string") {
        updates.fieldsOfInterest = updates.fieldsOfInterest.split(",").map(s => s.trim()).filter(s => s);
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true }
    );
    
    if (!updatedUser) return res.status(404).json({ msg: "User not found" });
    
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Resume via Profile Page
router.post("/:id/upload-resume", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "Please upload a valid resume." });
        }
        
        let candidate = await User.findById(req.params.id);
        if(!candidate) return res.status(404).json({ msg: "User not found" });

        const filePath = req.file.path;
        candidate.resumeUrl = filePath;

        // Send resume to AI service
        const form = new FormData();
        form.append("file", fs.createReadStream(filePath));

        const response = await axios.post(
            "http://127.0.0.1:8000/parse-resume",
            form,
            { headers: form.getHeaders() }
        );

        const { detected_skills, years_experience, cgpa, organizations, locations } = response.data;
        
        // Merge skills
        const combinedSkills = [...new Set([...candidate.skills, ...detected_skills])];

        candidate.skills = combinedSkills;
        if(years_experience > candidate.experience) candidate.experience = years_experience;
        if(cgpa > candidate.cgpa) candidate.cgpa = cgpa;
        
        // ML: Auto-fill profile from spaCy NER
        if (organizations && organizations.length > 0 && !candidate.instituteName) {
            candidate.instituteName = organizations[0];
        }
        if (locations && locations.length > 0 && !candidate.location) {
            candidate.location = locations[0];
        }
        
        await candidate.save();
        
        res.json({
            msg: "Resume uploaded and profile updated with AI analysis.",
            extractedData: { skills: detected_skills, experience: years_experience, cgpa, organizations, locations }
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
