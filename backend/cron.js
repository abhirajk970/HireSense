const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const Interview  = require('./models/Interview');
const Notification = require('./models/Notification');
const Application  = require('./models/Application');
const Job          = require('./models/Job');
const User         = require('./models/User');

// ── Helper: find next Mon-Fri 09:00-18:00 slot not conflicting with existing interviews ──
async function findNextWorkingSlot(interviewerId, notBefore) {
  const slot = new Date(notBefore);
  // Round up to the next full hour
  slot.setMinutes(0, 0, 0);
  slot.setHours(slot.getHours() + 1);

  for (let attempts = 0; attempts < 200; attempts++) {
    const day = slot.getDay(); // 0=Sun, 6=Sat
    const hour = slot.getHours();

    if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) {
      // Check no existing interview at this exact slot (±30 min)
      const slotStart = new Date(slot.getTime() - 30 * 60000);
      const slotEnd   = new Date(slot.getTime() + 30 * 60000);
      const conflict  = await Interview.findOne({
        interviewerId,
        status: 'Scheduled',
        scheduledAt: { $gte: slotStart, $lte: slotEnd }
      });
      if (!conflict) return slot;
    }

    // Advance by 1 hour
    slot.setHours(slot.getHours() + 1);
    // If past 18:00, jump to next day 09:00
    if (slot.getHours() >= 18) {
      slot.setDate(slot.getDate() + 1);
      slot.setHours(9, 0, 0, 0);
    }
  }
  return slot; // fallback
}

// ── Main cron: every minute ──────────────────────────────────────────────────
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    // ── 1. Interview reminders + auto-expiry ────────────────────────────────
    const scheduledInterviews = await Interview.find({ status: 'Scheduled' });

    for (const interview of scheduledInterviews) {
      const scheduledAt = new Date(interview.scheduledAt);
      const diffMins    = (scheduledAt - now) / 60000;

      // Auto-expire 1 hour past
      if (diffMins < -60) {
        interview.status = 'Expired';
        await interview.save();
        continue;
      }

      // 2-hour reminder
      if (diffMins >= 119 && diffMins <= 121 && !interview.remindersSent?.twoHour) {
        await Notification.create({
          userId: interview.candidateId,
          type: 'interview_reminder',
          title: 'Interview Reminder',
          message: `Your ${interview.stageName} interview is starting in approximately 2 hours!`,
          relatedJobId: interview.jobId
        });
        // Bug fix #9: only notify interviewer if one is assigned (AI interviews have no human interviewer)
        if (interview.interviewerId) {
          await Notification.create({
            userId: interview.interviewerId,
            type: 'interview_reminder',
            title: 'Interview Reminder',
            message: `You have an incoming ${interview.stageName} interview with a candidate in 2 hours.`,
            relatedJobId: interview.jobId
          });
        }
        interview.remindersSent = { ...interview.remindersSent?.toObject?.() || {}, twoHour: true };
        await interview.save();
      }

      // 5-minute reminder
      if (diffMins >= 4 && diffMins <= 6 && !interview.remindersSent?.fiveMin) {
        await Notification.create({
          userId: interview.candidateId,
          type: 'interview_reminder',
          title: 'Interview Starting Soon',
          message: `Your ${interview.stageName} interview is starting in 5 minutes! The Join button is now active.`,
          relatedJobId: interview.jobId
        });
        if (interview.interviewerId) {
          await Notification.create({
            userId: interview.interviewerId,
            type: 'interview_reminder',
            title: 'Interview Starting Soon',
            message: `Your ${interview.stageName} interview is starting in 5 minutes! Prepare to join.`,
            relatedJobId: interview.jobId
          });
        }
        interview.remindersSent = { ...interview.remindersSent?.toObject?.() || {}, fiveMin: true };
        await interview.save();
      }
    }

    // ── 2. Auto-OA shortlisting & Auto-Interview scheduling ─────────────────
    const activeJobs = await Job.find({ processStatus: 'Active' });

    for (const job of activeJobs) {
      const stages = job.stages || [];

      for (let i = 0; i < stages.length; i++) {
        const stage     = stages[i];
        const prevStage = stages[i - 1];
        if (!stage.startDate) continue;

        const stageStart = new Date(stage.startDate);
        const stageEnd   = stage.endDate ? new Date(stage.endDate) : null;
        const hasStarted = stageStart <= now;
        const notEnded   = !stageEnd || stageEnd >= now;
        if (!hasStarted || !notEnded) continue;

        const stageName = stage.name.toLowerCase();

        // ── 2a. Auto-OA shortlist when DSA/Assessment window opens ──────────
        const isDSAStage = stageName.includes('dsa') || stageName.includes('assessment');
        const isPrevResumeAuto = prevStage &&
          (prevStage.name.toLowerCase().includes('resume') || prevStage.name.toLowerCase().includes('screening')) &&
          prevStage.advanceMode === 'Auto' &&
          prevStage.advanceTopK > 0;

        if (isDSAStage && isPrevResumeAuto) {
          const topK = prevStage.advanceTopK;
          const notShortlisted = await Application.find({
            jobId: job._id,
            oaStatus: 'Not Scheduled',
            status: { $nin: ['Rejected', 'Hired'] }
          }).sort({ matchScore: -1 }).limit(topK);

          for (const app of notShortlisted) {
            app.oaStatus     = 'Scheduled';
            app.oaWindowStart = stageStart;
            app.oaWindowEnd   = stageEnd || new Date(stageStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            app.status        = 'Testing';
            await app.save();

            await Notification.create({
              userId: app.candidateId,
              type: 'oa_scheduled',
              title: 'Shortlisted for DSA Assessment!',
              message: `Congratulations! You've been auto-shortlisted for the DSA Assessment for "${job.title}". Window: ${app.oaWindowStart.toLocaleString('en-IN')} – ${app.oaWindowEnd.toLocaleString('en-IN')}.`,
              relatedJobId: job._id
            });
            console.log(`[Cron] Auto-shortlisted application ${app._id} for OA`);
          }
        }

        // ── 2b. Auto-Interview scheduling when Interview stage opens ─────────
        const isInterviewStage = stageName.includes('interview') &&
          stage.interviewType === 'Human' &&
          stage.advanceMode === 'Auto' &&
          (stage.advanceTopK || 0) > 0;
        const prevIsDSA = prevStage &&
          (prevStage.name.toLowerCase().includes('dsa') || prevStage.name.toLowerCase().includes('assessment'));

        // Only trigger in the first 2 minutes of stage opening to avoid re-runs
        const justOpened = (now - stageStart) < 2 * 60 * 1000;

        if (isInterviewStage && prevIsDSA && justOpened) {
          const topK = stage.advanceTopK;
          const qualified = await Application.find({
            jobId: job._id,
            oaStatus: 'Completed',
            oaScore: { $gte: 40 },
            status: { $nin: ['Rejected', 'Hired'] }
          }).sort({ oaScore: -1 }).limit(topK);

          // Get company interviewers
          let interviewers = await User.find({ role: 'interviewer', companyId: job.createdBy });
          if (stage.interviewerType && stage.interviewerType !== "Any") {
              interviewers = interviewers.filter(i => i.specialty === stage.interviewerType);
          }
          
          if (!interviewers.length) {
            console.log(`[Cron] No interviewers of type ${stage.interviewerType || 'Any'} found for job ${job._id} — skipping auto-schedule`);
            continue;
          }

          for (const app of qualified) {
            // Skip if already scheduled for this stage
            const exists = await Interview.findOne({ applicationId: app._id, stageName: stage.name });
            if (exists) continue;

            // Pick least-busy interviewer
            const loads = await Promise.all(interviewers.map(async iv => {
              const c = await Interview.countDocuments({ interviewerId: iv._id, status: 'Scheduled' });
              return { id: iv._id, count: c };
            }));
            loads.sort((a, b) => a.count - b.count);
            const assignedId = loads[0].id;

            const slot   = await findNextWorkingSlot(assignedId, stageStart > now ? stageStart : now);
            const roomId = uuidv4();

            await Interview.create({
              jobId: job._id,
              applicationId: app._id,
              interviewerId: assignedId,
              candidateId: app.candidateId,
              interviewMode: 'Human',
              stageName: stage.name,
              scheduledAt: slot,
              roomId,
              autoScheduled: true
            });

            await Notification.create({
              userId: app.candidateId,
              type: 'interview_scheduled',
              title: 'Interview Automatically Scheduled!',
              message: `Your ${stage.name} interview for "${job.title}" has been scheduled on ${slot.toLocaleString('en-IN')}.`,
              relatedJobId: job._id
            });

            app.status = 'Interview';
            await app.save();
            console.log(`[Cron] Auto-scheduled interview for application ${app._id} at ${slot}`);
          }
        }

        // ── 2c. Auto-Offer extension when Offer stage opens ─────────
        const isOfferStage = stageName.includes('offer') &&
          stage.advanceMode === 'Auto' &&
          (stage.advanceTopK || 0) > 0;
        
        if (isOfferStage && justOpened) {
            const topK = stage.advanceTopK;
            const topCandidates = await Application.find({
                jobId: job._id,
                status: { $nin: ['Rejected', 'Hired'] }
            }).sort({ oaScore: -1, matchScore: -1 }).limit(topK);

            for (const app of topCandidates) {
                app.status = 'Hired';
                await app.save();
                await Notification.create({
                    userId: app.candidateId,
                    type: "offer_extended",
                    title: "Job Offer Extended!",
                    message: `Congratulations! You have received a job offer for ${job.title}. Please check your email for details.`,
                    relatedJobId: job._id
                });
                console.log(`[Cron] Auto-extended offer to application ${app._id}`);
            }
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Error:', err.message);
  }
});
