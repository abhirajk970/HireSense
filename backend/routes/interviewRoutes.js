const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

const router = express.Router();

// Schedule an interview
router.post('/schedule', async (req, res) => {
    try {
        const { jobId, applicationId, interviewerId, candidateId, stageName, scheduledAt, interviewMode } = req.body;
        
        const roomId = uuidv4();
        
        const interview = await Interview.create({
            jobId,
            applicationId,
            interviewerId: interviewMode === 'AI' ? undefined : interviewerId,
            candidateId,
            interviewMode: interviewMode || 'Human',
            stageName,
            scheduledAt,
            roomId
        });

        // Push an in-app notification to the candidate
        await Notification.create({
            userId: candidateId,
            type: "interview_scheduled",
            title: "Interview Scheduled",
            message: `You have been scheduled for a ${stageName} interview on ${new Date(scheduledAt).toLocaleString()}.`,
            relatedJobId: jobId
        });

        res.status(201).json(interview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Interviews for Employer (includes both Human + AI interviews)
router.get('/company/:employerId', async (req, res) => {
    try {
        const Job = require('../models/Job');
        // Find all jobs created by this employer
        const employerJobs = await Job.find({ createdBy: req.params.employerId }).select('_id');
        const jobIds = employerJobs.map(j => j._id);

        // Find interviews where employer is interviewer OR interview is for one of their jobs
        const interviews = await Interview.find({
            $or: [
                { interviewerId: req.params.employerId },
                { jobId: { $in: jobIds } }
            ]
        })
            .populate('candidateId', 'name email profilePicture')
            .populate('jobId', 'title')
            .sort({ scheduledAt: -1 });
        res.json(interviews);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Interviews for Candidate
router.get('/candidate/:candidateId', async (req, res) => {
    try {
        const interviews = await Interview.find({ candidateId: req.params.candidateId })
            .populate('interviewerId', 'companyName email')
            .populate('jobId', 'title')
            .sort({ scheduledAt: -1 });
        res.json(interviews);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Interview Status by roomId (for one-time join enforcement)
router.get('/:roomId/status', async (req, res) => {
    try {
        const interview = await Interview.findOne({ roomId: req.params.roomId });
        if (!interview) return res.status(404).json({ msg: 'Interview not found' });
        res.json({ status: interview.status, scheduledAt: interview.scheduledAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save interview feedback and scores
router.put('/:roomId/feedback', async (req, res) => {
    try {
        const { scores, interviewerNotes, candidateFeedback, status } = req.body;
        const updates = {};
        if (scores) updates.scores = scores;
        if (interviewerNotes !== undefined) updates.interviewerNotes = interviewerNotes;
        if (candidateFeedback !== undefined) updates.candidateFeedback = candidateFeedback;
        if (status) updates.status = status;

        const interview = await Interview.findOneAndUpdate(
            { roomId: req.params.roomId },
            { $set: updates },
            { new: true }
        );
        if (!interview) return res.status(404).json({ msg: 'Interview not found' });
        res.json(interview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
