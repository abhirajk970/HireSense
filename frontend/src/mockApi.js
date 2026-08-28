import axios from "axios";

// Helper to access / update localStorage collections
const getDB = (key, defaultVal = []) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(data);
};

const setDB = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// ==========================================
// 1. RICH PRELOADED SHOWCASE DATA SEEDER
// ==========================================
const initMockDB = () => {
  // Preloaded jobs
  const defaultJobs = [
    {
      _id: "job-ai-ml",
      title: "AI/ML Software Engineer",
      description: "Join our core team building LLM orchestration and fine-tuning pipelines. You will optimize inference workloads, manage vector databases, and integrate local LLM agents (like LLaMA 3) into customer workflows.",
      requiredSkills: ["Python", "PyTorch", "LLaMA", "NLP", "React", "Vector DB"],
      location: "San Francisco",
      experienceRequired: 3,
      salaryRange: "$140,000 - $180,000",
      applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      stages: [
        { name: "Resume Screening", startDate: new Date().toISOString() },
        { name: "Assignment", startDate: new Date().toISOString() },
        { name: "AI Technical Interview", startDate: new Date().toISOString() },
        { name: "Final Offer", startDate: new Date().toISOString() }
      ],
      status: "Open",
      createdBy: { _id: "company-hiresense", companyName: "HireSense Corp" }
    },
    {
      _id: "job-backend",
      title: "Senior Backend Engineer (Node.js)",
      description: "We are looking for a Node.js/Express expert to scale our core event-driven microservices database cluster. You will design secure APIs, orchestrate WebSockets, and maintain low-latency PostgreSQL and MongoDB architectures.",
      requiredSkills: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "Redis"],
      location: "Remote",
      experienceRequired: 5,
      salaryRange: "$150,000 - $190,000",
      applicationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      stages: [
        { name: "Resume Screening", startDate: new Date().toISOString() },
        { name: "Assignment", startDate: new Date().toISOString() },
        { name: "Live Video Coding", startDate: new Date().toISOString() },
        { name: "Final Offer", startDate: new Date().toISOString() }
      ],
      status: "Open",
      createdBy: { _id: "company-hiresense", companyName: "HireSense Corp" }
    },
    {
      _id: "job-frontend",
      title: "Lead Frontend Architect",
      description: "Lead the UX architecture of our modern talent acquisition dashboards. Work with React, Vite, Tailwind CSS, and state management engines to build gorgeous, micro-animated interfaces that load under 400ms.",
      requiredSkills: ["React", "TypeScript", "Tailwind", "CSS", "System Design", "Webpack"],
      location: "New York",
      experienceRequired: 6,
      salaryRange: "$160,000 - $210,000",
      applicationDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Closed
      stages: [
        { name: "Resume Screening", startDate: new Date().toISOString() },
        { name: "Assignment", startDate: new Date().toISOString() },
        { name: "Technical Screen", startDate: new Date().toISOString() },
        { name: "Final Offer", startDate: new Date().toISOString() }
      ],
      status: "Open",
      createdBy: { _id: "company-hiresense", companyName: "HireSense Corp" }
    }
  ];

  // Candidates Profiles
  const defaultProfiles = {
    "candidate-sarah": {
      _id: "candidate-sarah",
      name: "Sarah Jenkins",
      email: "sarah.jenkins@gmail.com",
      skills: ["Python", "PyTorch", "LLaMA", "TensorFlow", "NLP", "Vector DB"],
      education: "Master of Science in Data Science - MIT",
      experience: "Machine Learning Engineer at Microsoft (3 Years)",
      expectedSalary: 155000,
      resumeUrl: "mock-sarah-resume.pdf"
    },
    "candidate-abhiraj": {
      _id: "candidate-abhiraj",
      name: "Abhiraj Kumar",
      email: "abhiraj.k970@gmail.com",
      skills: ["Node.js", "Express", "React", "MongoDB", "PostgreSQL", "Docker", "Python"],
      education: "Bachelor of Technology in Computer Science - IIT",
      experience: "Full Stack Engineer at Tech Solutions (4 Years)",
      expectedSalary: 160000,
      resumeUrl: "mock-abhiraj-resume.pdf"
    },
    "candidate-alex": {
      _id: "candidate-alex",
      name: "Alex Rivera",
      email: "alex.rivera@design.co",
      skills: ["React", "TypeScript", "Tailwind", "CSS", "HTML", "System Design"],
      education: "Bachelor of Science in Computer Science - UT Austin",
      experience: "Lead UI Developer at Tesla (5 Years)",
      expectedSalary: 165000,
      resumeUrl: "mock-alex-resume.pdf"
    }
  };

  // Applications DB
  const defaultApplications = [
    {
      _id: "app-sarah",
      jobId: defaultJobs[0], // AI/ML
      candidateId: "candidate-sarah",
      status: "Testing",
      matchScore: 95,
      oaStatus: "Scheduled",
      oaWindowStart: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Active now
      oaWindowEnd: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      proctoringLogs: [
        { event: "Webcam Access Allowed", time: "03:00 PM" },
        { event: "Fullscreen mode requested & locked", time: "03:01 PM" }
      ],
      aiScore: null,
      notes: "Exceptional machine learning portfolio. Pre-shortlisted based on semantic match."
    },
    {
      _id: "app-abhiraj",
      jobId: defaultJobs[1], // Backend
      candidateId: "candidate-abhiraj",
      status: "Applied",
      matchScore: 85,
      oaStatus: "Not Scheduled",
      proctoringLogs: [],
      notes: "Solid Node.js & Docker engineering background. Expected salary matches budget."
    },
    {
      _id: "app-alex",
      jobId: defaultJobs[2], // Frontend
      candidateId: "candidate-alex",
      status: "Interview",
      matchScore: 92,
      oaStatus: "Completed",
      proctoringLogs: [
        { event: "Candidate switched tab", time: "11:15 AM" },
        { event: "Resume Sandbox finished", time: "11:45 AM" }
      ],
      notes: "Outstanding clean CSS/Tailwind skills. Highly recommended for Lead design."
    }
  ];

  // Interviews DB
  const defaultInterviews = [
    {
      _id: "int-sarah-ai",
      roomId: "room-sarah-llama",
      jobId: defaultJobs[0],
      candidateId: { _id: "candidate-sarah", name: "Sarah Jenkins" },
      stageName: "AI Technical Interview (DSA)",
      interviewMode: "AI",
      scheduledAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // Happening now!
      status: "Scheduled"
    },
    {
      _id: "int-alex-live",
      roomId: "room-alex-live",
      jobId: defaultJobs[2],
      candidateId: { _id: "candidate-alex", name: "Alex Rivera" },
      stageName: "Live Architecture Review",
      interviewMode: "Live",
      interviewerId: { companyName: "HireSense Engineering" },
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Scheduled in 2 hours
      status: "Scheduled"
    }
  ];

  // Assessment Questions
  const defaultQuestions = [
    {
      _id: "q-1",
      title: "Two Sum",
      difficulty: "Easy",
      description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
      templates: {
        javascript: "function twoSum(nums, target) {\n    // Write your code here\n    \n}",
        python: "def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your code here\n    pass",
        cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    // Write your code here\n    \n}"
      },
      testCases: [
        { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false },
        { input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: false },
        { input: "[3,3], 6", expectedOutput: "[0,1]", isHidden: true }
      ]
    },
    {
      _id: "q-2",
      title: "Reverse Linked List",
      difficulty: "Medium",
      description: "Given the `head` of a singly linked list, reverse the list, and return the reversed list.",
      templates: {
        javascript: "function reverseList(head) {\n    // Write your code here\n    \n}",
        python: "def reverseList(head):\n    # Write your code here\n    pass",
        cpp: "ListNode* reverseList(ListNode* head) {\n    // Write your code here\n    \n}"
      },
      testCases: [
        { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]", isHidden: false },
        { input: "[1,2]", expectedOutput: "[2,1]", isHidden: false }
      ]
    }
  ];

  const defaultInterviewers = [
    { _id: "int-1", name: "David Chen", email: "david@hiresense.com", role: "Principal Architect" },
    { _id: "int-2", name: "Samantha Ross", email: "samantha@hiresense.com", role: "HR Lead" }
  ];

  getDB("demo_jobs", defaultJobs);
  getDB("demo_profiles", defaultProfiles);
  getDB("demo_applications", defaultApplications);
  getDB("demo_interviews", defaultInterviews);
  getDB("demo_questions", defaultQuestions);
  getDB("demo_interviewers", defaultInterviewers);
  getDB("demo_notifications", [
    { _id: "n-1", userId: "demo-id", text: "New applicant Sarah Jenkins applied for AI/ML Engineer!", isRead: false, time: "10 mins ago" },
    { _id: "n-2", userId: "candidate-sarah", text: "Your assessment window for AI/ML Engineer is now open.", isRead: false, time: "Just now" }
  ]);
};

// Trigger database seed
initMockDB();

// ==========================================
// 2. AXIOS INTERCEPTOR FOR DEMO TELEPORTATION
// ==========================================
axios.interceptors.request.use((config) => {
  const isDemo = localStorage.getItem("demoMode") === "true";

  if (!isDemo) {
    return config;
  }

  // Intercept the request and direct it to a mock adaptor
  config.adapter = async (cfg) => {
    const url = cfg.url;
    const method = cfg.method.toLowerCase();
    const data = cfg.data ? JSON.parse(cfg.data) : null;

    console.log(`[Demo Interceptor] ${method.toUpperCase()} ${url}`, data);

    // Mock response helper
    const respond = (status, payload) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: payload,
            status: status,
            statusText: "OK",
            headers: {},
            config: cfg,
            request: {}
          });
        }, 150); // Fast mock network latency
      });
    };

    // --- AUTH MOCK ---
    if (url.includes("/api/auth/login")) {
      const email = data.email || "demo@hiresense.com";
      let role = "company";
      let userId = "demo-id";
      let companyId = "company-hiresense";
      let name = "Demo Employer";

      if (email.includes("candidate")) {
        role = "candidate";
        userId = "candidate-sarah";
        name = "Sarah Jenkins";
      } else if (email.includes("interviewer")) {
        role = "interviewer";
        userId = "int-1";
        name = "David Chen";
      }

      return respond(200, {
        token: "demo-mock-jwt-token",
        role,
        userId,
        companyId,
        name
      });
    }

    // --- PROFILE MOCK & PARSING ENGINE ---
    if (url.includes("/api/profile/")) {
      const parts = url.split("/");
      const candidateId = parts[parts.length - 2]; // e.g. candidate-id

      if (url.endsWith("/upload-resume")) {
        // Simulates dynamic resume extraction depending on which mock file they clicked
        // We will seed the profile with John, Sarah, or Emily based on their selection
        const profiles = getDB("demo_profiles");
        let activeProfile = profiles["candidate-sarah"]; // default

        // Pick dynamic profile to return
        const selectedResume = localStorage.getItem("selectedResumeName") || "Sarah Jenkins";
        if (selectedResume.toLowerCase().includes("abhiraj") || selectedResume.toLowerCase().includes("backend")) {
          activeProfile = profiles["candidate-abhiraj"];
        } else if (selectedResume.toLowerCase().includes("alex") || selectedResume.toLowerCase().includes("frontend")) {
          activeProfile = profiles["candidate-alex"];
        }

        // Save back into active candidate profile
        localStorage.setItem("userId", activeProfile._id);
        localStorage.setItem("userName", activeProfile.name);

        return respond(200, activeProfile);
      }

      // Fetch or update candidate profile
      const profiles = getDB("demo_profiles");
      const activeId = candidateId === "demo-id" || candidateId === "undefined" ? "candidate-sarah" : candidateId;
      let targetProfile = profiles[activeId];
      if (!targetProfile) {
        targetProfile = {
          _id: activeId,
          name: localStorage.getItem("userName") || "Sarah Jenkins",
          email: "sarah.jenkins@gmail.com",
          skills: ["React", "JavaScript", "Python"],
          education: "B.S. Computer Science",
          experience: "Frontend Dev (2 Years)",
          expectedSalary: 120000
        };
        profiles[activeId] = targetProfile;
        setDB("demo_profiles", profiles);
      }

      if (method === "put") {
        const merged = { ...targetProfile, ...data };
        profiles[activeId] = merged;
        setDB("demo_profiles", profiles);
        return respond(200, merged);
      }

      return respond(200, targetProfile);
    }

    // --- JOBS ENDPOINTS ---
    if (url.includes("/api/jobs")) {
      let jobs = getDB("demo_jobs");

      if (url.endsWith("/upload-assignment")) {
        return respond(200, { assignmentUrl: "mock-coding-prompt.pdf" });
      }

      // GET /api/jobs/:id
      const matchJobDetail = url.match(/\/api\/jobs\/([a-zA-Z0-9\-]+)$/);
      if (matchJobDetail) {
        const jobId = matchJobDetail[1];
        const job = jobs.find(j => j._id === jobId);
        return respond(200, job || jobs[0]);
      }

      // PUT /api/jobs/:id/close
      if (url.includes("/close")) {
        const id = url.split("/")[url.split("/").length - 2];
        jobs = jobs.map(j => j._id === id ? { ...j, status: "Closed" } : j);
        setDB("demo_jobs", jobs);
        return respond(200, { msg: "Job closed" });
      }

      // PUT /api/jobs/:id/reopen
      if (url.includes("/reopen")) {
        const id = url.split("/")[url.split("/").length - 2];
        jobs = jobs.map(j => j._id === id ? { ...j, status: "Open" } : j);
        setDB("demo_jobs", jobs);
        return respond(200, { msg: "Job reopened" });
      }

      // DELETE /api/jobs/:id
      if (method === "delete") {
        const id = url.split("/").pop();
        jobs = jobs.filter(j => j._id !== id);
        setDB("demo_jobs", jobs);
        return respond(200, { msg: "Job deleted" });
      }

      // PUT /api/jobs/:id/stages
      if (url.includes("/stages")) {
        const id = url.split("/")[url.split("/").length - 2];
        jobs = jobs.map(j => j._id === id ? { ...j, stages: data.stages } : j);
        setDB("demo_jobs", jobs);
        return respond(200, { msg: "Stages updated" });
      }

      // POST /api/jobs (New Job creation)
      if (method === "post") {
        const newJob = {
          _id: `job-${Date.now()}`,
          title: data.title,
          description: data.description,
          requiredSkills: data.requiredSkills || [],
          location: data.location || "Remote",
          experienceRequired: parseInt(data.experienceRequired || 0),
          salaryRange: data.salaryRange || "$100,000+",
          applicationDeadline: data.applicationDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          stages: data.stages || [
            { name: "Resume Screening", startDate: new Date().toISOString() },
            { name: "Final Offer", startDate: new Date().toISOString() }
          ],
          status: "Open",
          createdBy: { _id: "company-hiresense", companyName: "HireSense Corp" }
        };
        jobs.unshift(newJob);
        setDB("demo_jobs", jobs);
        return respond(200, newJob);
      }

      // GET /api/jobs
      return respond(200, jobs);
    }

    // --- APPLICATIONS ENDPOINTS ---
    if (url.includes("/api/applications")) {
      let apps = getDB("demo_applications");

      // GET /api/applications/company/:id
      if (url.includes("/company/")) {
        return respond(200, apps);
      }

      // GET /api/applications/candidate/:id
      if (url.includes("/candidate/")) {
        const candId = url.split("/").pop();
        const candApps = apps.filter(a => a.candidateId === candId || a.candidateId?._id === candId);
        return respond(200, candApps);
      }

      // POST /api/applications/:id/shortlist
      if (url.includes("/shortlist")) {
        const id = url.split("/")[url.split("/").length - 2];
        apps = apps.map(a => a._id === id ? { ...a, status: "Testing", oaStatus: "Scheduled", oaWindowStart: new Date().toISOString(), oaWindowEnd: new Date(Date.now() + 48*60*60*1000).toISOString() } : a);
        setDB("demo_applications", apps);
        return respond(200, { msg: "Shortlisted for OA!" });
      }

      // POST /api/applications/:id/offer
      if (url.includes("/offer")) {
        const id = url.split("/")[url.split("/").length - 2];
        apps = apps.map(a => a._id === id ? { ...a, status: "Offer" } : a);
        setDB("demo_applications", apps);
        return respond(200, { msg: "Offer generated!" });
      }

      // POST /api/applications/:id/assignment
      if (url.includes("/assignment")) {
        const id = url.split("/")[url.split("/").length - 2];
        apps = apps.map(a => a._id === id ? { ...a, status: "Interview" } : a);
        setDB("demo_applications", apps);
        return respond(200, { msg: "Assignment submitted!" });
      }

      // POST /api/applications (Create application)
      if (method === "post") {
        const jobs = getDB("demo_jobs");
        const job = jobs.find(j => j._id === data.jobId) || jobs[0];

        const newApp = {
          _id: `app-${Date.now()}`,
          jobId: job,
          candidateId: data.candidateId || "candidate-sarah",
          status: "Applied",
          matchScore: Math.floor(Math.random() * 30) + 70, // 70 to 100
          oaStatus: "Not Scheduled",
          proctoringLogs: [],
          notes: "Applied via Recruiter Interactive Sandbox."
        };
        apps.unshift(newApp);
        setDB("demo_applications", apps);
        return respond(200, newApp);
      }

      return respond(200, apps);
    }

    // --- INTERVIEWS ENDPOINTS ---
    if (url.includes("/api/interviews")) {
      let ints = getDB("demo_interviews");

      // GET /api/interviews/candidate/:id
      if (url.includes("/candidate/")) {
        const candId = url.split("/").pop();
        const candInts = ints.filter(i => i.candidateId === candId || i.candidateId?._id === candId);
        return respond(200, candInts);
      }

      // GET /api/interviews/company/:id
      if (url.includes("/company/")) {
        return respond(200, ints);
      }

      // GET /api/interviews/application/:appId
      if (url.includes("/application/")) {
        const appId = url.split("/").pop();
        const appInt = ints.find(i => i.roomId?.includes(appId) || i._id.includes(appId));
        return respond(200, appInt ? [appInt] : []);
      }

      // POST /api/interviews/schedule (Schedules interview)
      if (url.includes("/schedule")) {
        const apps = getDB("demo_applications");
        const app = apps.find(a => a._id === data.applicationId);

        const newInt = {
          _id: `int-${Date.now()}`,
          roomId: `room-${Date.now()}`,
          jobId: app ? app.jobId : { title: "Software Architect" },
          candidateId: {
            _id: app ? app.candidateId : "candidate-sarah",
            name: app ? (getDB("demo_profiles")[app.candidateId]?.name || "Jane Doe") : "Jane Doe"
          },
          stageName: data.stageName || "AI Interview Round",
          interviewMode: data.interviewMode || "AI",
          scheduledAt: data.scheduledAt || new Date(Date.now() + 5*60*1000).toISOString(),
          status: "Scheduled"
        };
        ints.unshift(newInt);
        setDB("demo_interviews", ints);

        // Update application status to Interview
        const updatedApps = apps.map(a => a._id === data.applicationId ? { ...a, status: "Interview" } : a);
        setDB("demo_applications", updatedApps);

        return respond(200, newInt);
      }

      return respond(200, ints);
    }

    // --- INTERVIEWERS ENDPOINTS ---
    if (url.includes("/api/interviewers")) {
      let ints = getDB("demo_interviewers");

      if (method === "post") {
        const nInt = {
          _id: `intr-${Date.now()}`,
          name: data.name,
          email: data.email,
          role: data.role || "Technical Lead"
        };
        ints.push(nInt);
        setDB("demo_interviewers", ints);
        return respond(200, nInt);
      }

      if (method === "delete") {
        const id = url.split("/").pop();
        ints = ints.filter(i => i._id !== id);
        setDB("demo_interviewers", ints);
        return respond(200, { msg: "Interviewer deleted" });
      }

      return respond(200, ints);
    }

    // --- NOTIFICATIONS ENDPOINTS ---
    if (url.includes("/api/notifications")) {
      let notifs = getDB("demo_notifications");

      if (url.includes("/unread-count")) {
        const unread = notifs.filter(n => !n.isRead).length;
        return respond(200, { unreadCount: unread });
      }

      if (url.includes("/read-all")) {
        notifs = notifs.map(n => ({ ...n, isRead: true }));
        setDB("demo_notifications", notifs);
        return respond(200, { msg: "All read" });
      }

      if (url.endsWith("/read")) {
        const id = url.split("/")[url.split("/").length - 2];
        notifs = notifs.map(n => n._id === id ? { ...n, isRead: true } : n);
        setDB("demo_notifications", notifs);
        return respond(200, { msg: "Read" });
      }

      return respond(200, notifs);
    }

    // --- ONLINE ASSESSMENT (OA) SERVICES MOCKS ---
    if (url.includes("/api/assessments") || url.includes(":5001")) {
      const qDB = getDB("demo_questions");

      // Questions List
      if (url.endsWith("/questions") || url.endsWith("/questions/all")) {
        return respond(200, qDB);
      }

      // Solved candidates (Practice page)
      if (url.includes("/practice/solved/")) {
        return respond(200, [{ questionId: "q-1", solved: true, score: 100 }]);
      }

      // Start OA
      if (url.endsWith("/start")) {
        const assessmentId = `assess-${Date.now()}`;
        const newOA = {
          _id: assessmentId,
          applicationId: data.applicationId || "app-sarah",
          candidateId: data.candidateId || "candidate-sarah",
          status: "Started",
          score: null,
          startedAt: new Date().toISOString()
        };
        localStorage.setItem(`oa-${assessmentId}`, JSON.stringify(newOA));
        return respond(200, newOA);
      }

      // Log Proctoring
      if (url.includes("/log-proctoring")) {
        const id = data.assessmentId;
        const apps = getDB("demo_applications");
        const matchedApp = apps.find(a => a._id === "app-sarah" || a.candidateId === "candidate-sarah");

        if (matchedApp) {
          matchedApp.proctoringLogs.push({
            event: data.event,
            time: new Date().toLocaleTimeString()
          });
          setDB("demo_applications", apps);
        }
        return respond(200, { msg: "Logged successfully" });
      }

      // Run Code
      if (url.includes("/run-code")) {
        const question = qDB.find(q => q._id === data.questionId) || qDB[0];
        const results = question.testCases.map((tc, idx) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: tc.expectedOutput, // Always compile successfully for recruiter convenience!
          passed: true
        }));

        return respond(200, {
          allPassed: true,
          mode: "run",
          passed: results.length,
          total: results.length,
          visibleResults: results.filter(r => !r.isHidden)
        });
      }

      // Submit Code
      if (url.includes("/submit-code")) {
        const question = qDB.find(q => q._id === data.questionId) || qDB[0];
        const results = question.testCases.map((tc, idx) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: tc.expectedOutput,
          passed: true
        }));

        return respond(200, {
          allPassed: true,
          mode: "submit",
          passed: results.length,
          total: results.length,
          results,
          score: 100,
          hiddenSummary: { passed: 1, total: 1 }
        });
      }

      // Finish Assessment
      if (url.endsWith("/finish")) {
        const apps = getDB("demo_applications");
        const sarahApp = apps.find(a => a._id === "app-sarah");
        if (sarahApp) {
          sarahApp.status = "Interview";
          sarahApp.oaStatus = "Completed";
          setDB("demo_applications", apps);
        }
        return respond(200, { msg: "OA finalized" });
      }
    }

    // --- AI INTERVIEW (LLAMA) MICROSERVICE MOCKS ---
    if (url.includes("/api/ai-interview") || url.includes("/api/dsa") || url.includes(":5200")) {
      if (url.endsWith("/status")) {
        return respond(200, { status: "Active" });
      }

      if (url.includes("/request-hint")) {
        const hints = [
          "Hint 1: Try using a hash map to keep track of the complements as you loop.",
          "Hint 2: The complement is calculated as: target - nums[i]. Check if this complement exists in your dictionary.",
          "Hint 3: You can complete this search in a single pass O(N) time!",
          "Hint 4: Here is the code structure: store indices as values and elements as keys inside your map."
        ];
        const lvl = parseInt(localStorage.getItem("demoHintLevel") || "0") + 1;
        localStorage.setItem("demoHintLevel", lvl.toString());

        return respond(200, {
          message: hints[Math.min(lvl - 1, 3)],
          hintLevel: Math.min(lvl, 4),
          penalty: lvl * 5
        });
      }
    }

    // --- AI INTERVIEW PRACTICE (5300) SERVICES MOCKS ---
    if (url.includes("/api/practice-session") || url.includes(":5300")) {
      if (url.endsWith("/start")) {
        const welcomeText = {
          Frontend: "👋 Hi there! I am your HireSense Frontend Practice Coach. Let's do a fast-paced mock review.\n\nTo begin: Can you describe the difference between React Server Components (RSC) and traditional Client Components?",
          Backend: "👋 Welcome! I am your Backend Development Coach. Today we'll cover caches, replication, docker.\n\nLet's start: How would you design a caching layer using Redis, and how do you handle invalidations?",
          Behavioral: "👋 Hello! I am your Behavioral Prep Coach. Let's practice behavioral storytelling using STAR.\n\nTo begin: Tell me about a time when you faced a major technical disagreement with a team member."
        }[data.discipline] || "👋 Hello! Tell me about a major technical project you completed recently.";

        return respond(200, {
          _id: `practice-${Date.now()}`,
          discipline: data.discipline,
          messages: [{ role: "ai", text: welcomeText }],
          isCompleted: false
        });
      }

      if (url.endsWith("/respond")) {
        const replies = [
          "Excellent point! That is a very accurate explanation. Next follow-up: How do you design database sharding or replication to scale write-heavy SQL clusters?",
          "Very solid technical overview. Next question: What is the difference between JWT tokens and session cookies, and how do you prevent CSRF?",
          "That wraps up our topics! I have gathered enough data. Go ahead and click 'Finalize Evaluation' to receive your grading report card."
        ];
        
        // Count user message length for mock progression
        const replyIndex = Math.min(Math.floor(Math.random() * 2), 2);
        
        return respond(200, {
          _id: data.sessionId,
          messages: [
            { role: "candidate", text: data.text },
            { role: "ai", text: replies[replyIndex] }
          ],
          isCompleted: false
        });
      }

      if (url.endsWith("/evaluate")) {
        return respond(200, {
          _id: data.sessionId,
          isCompleted: true,
          scores: {
            score: 92,
            feedback: "Exceptional capabilities shown during practice. Spoke with absolute clarity, highlighting stellar operational frameworks, cache invalidations, and conflict resolving metrics.",
            improvements: [
              "Study distributed locks on multi-node clusters.",
              "Prepare highly quantitative metric outcomes for STAR storytelling.",
              "Review the React virtual DOM reconciliation source algorithms."
            ]
          }
        });
      }
    }

    // Fallback if endpoint not explicitly caught in demo interceptor
    return respond(404, { msg: "Mock endpoint not found." });
  };
});
