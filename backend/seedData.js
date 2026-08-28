const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Job = require("./models/Job");
const Application = require("./models/Application");
const Interview = require("./models/Interview");

const seedDatabase = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/hiresense");
    console.log("🔌 Connected to database for seeding...");

    // Clear existing collections
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Interview.deleteMany({});
    console.log("🧹 Cleared old user/job/application database logs.");

    const hashedPassword = bcrypt.hashSync("password123", 10);

    // 1. Create Company
    const company = await User.create({
      name: "Acme Tech Solutions",
      email: "recruiter@hiresense.com",
      password: hashedPassword,
      role: "company",
      companyName: "Acme Tech Solutions",
      description: "Building the next generation of scalable cloud solutions.",
      website: "https://acme.example.com",
      industry: "Information Technology",
      companySize: "50-200 employees",
      founded: "2018",
      phone: "+15550198",
      location: "San Francisco, CA"
    });
    console.log("🏢 Seeding Company profile: recruiter@hiresense.com");

    // 2. Create Candidate
    const candidate = await User.create({
      name: "Sarah Jenkins",
      email: "candidate@hiresense.com",
      password: hashedPassword,
      role: "candidate",
      phone: "+15559876",
      bio: "Passionate Backend Software Engineer specialized in Node.js, Python, and Docker architectures.",
      skills: ["React", "Node", "MongoDB", "Python", "Docker", "SQL", "Git", "TypeScript", "JavaScript"],
      experience: 3,
      cgpa: 3.85,
      instituteName: "University of California, Berkeley",
      linkedin: "https://linkedin.com/in/sarahjenkins-demo",
      github: "https://github.com/sarahjenkins-demo",
      location: "San Francisco, CA",
      openToWork: true
    });
    console.log("👤 Seeding Candidate profile: candidate@hiresense.com");

    // 3. Create Interviewer
    const interviewer = await User.create({
      name: "Alex Mercer",
      email: "interviewer@hiresense.com",
      password: hashedPassword,
      role: "interviewer",
      companyId: company._id,
      specialty: "Backend Architect",
      timezone: "Asia/Kolkata",
      phone: "+15554321"
    });
    console.log("👨‍💻 Seeding Interviewer profile: interviewer@hiresense.com");

    // 4. Create Job
    const job = await Job.create({
      title: "Backend Software Engineer",
      description: "We are seeking a senior backend software engineer proficient in Node.js, MongoDB, and Event-Driven Queue patterns (Kafka/Redis) to lead architectural scaleouts.",
      requiredSkills: ["Node", "MongoDB", "Git", "JavaScript"],
      experienceRequired: 2,
      location: "Remote",
      jobType: "Full-time",
      salaryRange: "$100,000 - $130,000",
      numberOfOpenings: 2,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: company._id,
      stages: [
        {
          name: "Resume Screening",
          advanceMode: "Auto",
          interviewType: "None"
        },
        {
          name: "Online Assessment",
          advanceMode: "Manual",
          interviewType: "None"
        },
        {
          name: "AI Interview",
          advanceMode: "Manual",
          interviewType: "AI"
        },
        {
          name: "HR Round",
          advanceMode: "Manual",
          interviewType: "Human"
        }
      ]
    });
    console.log("💼 Seeding Job: Backend Software Engineer");

    // 5. Create Application
    const application = await Application.create({
      candidateId: candidate._id,
      jobId: job._id,
      resumePath: "uploads/resumes/sarah_jenkins_cv.pdf",
      resumeScore: 88,
      matchScore: 90,
      status: "Testing",
      oaStatus: "Scheduled",
      oaWindowStart: new Date(),
      oaWindowEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    console.log("📝 Seeding Candidate Job Application");

    // 6. Create AI Interview session
    const aiInterview = await Interview.create({
      jobId: job._id,
      applicationId: application._id,
      candidateId: candidate._id,
      interviewMode: "AI",
      stageName: "AI Interview",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "Scheduled",
      roomId: "demo-room-sarah"
    });
    console.log("🎙️ Seeding Scheduled AI Interview Session");

    console.log("\n✅ HireSense core database seeded successfully!");
    console.log("👉 Use 'password123' as password for all seeded accounts.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

seedDatabase();
