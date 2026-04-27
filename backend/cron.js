const cron = require('node-cron');
const Interview = require('./models/Interview');
const Notification = require('./models/Notification');

// Run every minute
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const upcomingInterviews = await Interview.find({ status: "Scheduled" });

        for (const interview of upcomingInterviews) {
            const scheduledAt = new Date(interview.scheduledAt);
            const diffMs = scheduledAt - now;
            const diffMins = diffMs / 60000;

            // Auto-expire interviews that are 1 hour past their scheduled time
            if (diffMins < -60) {
                interview.status = "Expired";
                await interview.save();
                continue;
            }

            // 2-hour reminder (window: 119–121 mins to tolerate cron drift)
            if (diffMins >= 119 && diffMins <= 121 && !interview.remindersSent?.twoHour) {
               await Notification.create({
                   userId: interview.candidateId,
                   type: "interview_reminder",
                   title: "Interview Reminder",
                   message: `Your ${interview.stageName} interview is starting in approximately 2 hours!`,
                   relatedJobId: interview.jobId
               });
               await Notification.create({
                   userId: interview.interviewerId,
                   type: "interview_reminder",
                   title: "Interview Reminder",
                   message: `You have an incoming ${interview.stageName} interview with a candidate in 2 hours.`,
                   relatedJobId: interview.jobId
               });
               interview.remindersSent = { ...interview.remindersSent?.toObject?.() || {}, twoHour: true };
               await interview.save();
            }

            // 5-minute reminder (window: 4–6 mins)
            if (diffMins >= 4 && diffMins <= 6 && !interview.remindersSent?.fiveMin) {
               await Notification.create({
                   userId: interview.candidateId,
                   type: "interview_reminder",
                   title: "Interview Starting Soon",
                   message: `Your ${interview.stageName} interview is starting in 5 minutes! The Join button is now active.`,
                   relatedJobId: interview.jobId
               });
               await Notification.create({
                   userId: interview.interviewerId,
                   type: "interview_reminder",
                   title: "Interview Starting Soon",
                   message: `Your ${interview.stageName} interview is starting in 5 minutes! Prepare to join.`,
                   relatedJobId: interview.jobId
               });
               interview.remindersSent = { ...interview.remindersSent?.toObject?.() || {}, fiveMin: true };
               await interview.save();
            }
        }
    } catch (err) {
        console.error("Cron job error:", err);
    }
});
