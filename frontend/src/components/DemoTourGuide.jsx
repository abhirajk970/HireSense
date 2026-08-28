import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const DEMO_TTL_SECONDS = 15 * 60; // 15 minutes matches backend TTL

export default function DemoTourGuide() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DEMO_TTL_SECONDS);
  const timerRef = useRef(null);

  const role = localStorage.getItem("role") || "company";
  const userId = localStorage.getItem("userId") || "demo-id";
  const recruiterName = localStorage.getItem("userName") || "Recruiter";
  const demoCompany = localStorage.getItem("demoCompany") || "";
  const demoRoomId = localStorage.getItem("demoRoomId") || `demo-default-${Date.now()}`;

  // ─── 15-min countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          cleanupDemoData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const cleanupDemoData = async () => {
    // Clear localStorage demo keys
    localStorage.removeItem("demoMode");
    localStorage.removeItem("demo_applications");
    localStorage.removeItem("demo_interviews");
    // Hit the backend to hard-delete demo AI interview sessions from MongoDB
    try {
      await axios.delete("http://localhost:5200/api/dsa/demo-cleanup");
    } catch (e) {
      console.warn("[Demo] Could not reach backend cleanup endpoint:", e.message);
    }
  };

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Auto-detect step based on the current URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/company") && !path.includes("/settings")) {
      setActiveStep(0);
    } else if (path.includes("/candidate") || path.includes("/apply/")) {
      setActiveStep(1);
    } else if (path.includes("/demo/assessment")) {
      setActiveStep(2);
    } else if (path.includes("/demo/ai-interview")) {
      setActiveStep(3);
    } else if (path.includes("/offer")) {
      setActiveStep(4);
    }
  }, [location.pathname]);

  const steps = [
    {
      title: "1. Post an AI/ML Job (Employer)",
      desc: "Go to the Employer Dashboard, create a job with specific skill criteria, and see how our semantic system processes details.",
      actionLabel: "🏢 Switch to Employer",
      targetPath: "/company"
    },
    {
      title: "2. Apply & Smart Match (Candidate)",
      desc: "Simulate candidate application. Select John Smith or Sarah Jenkins' premium resume and watch the parser score their semantic skills instantly.",
      actionLabel: "👤 Switch to Candidate",
      targetPath: "/candidate"
    },
    {
      title: "3. Proctored Sandbox (OA)",
      desc: "Experience proctored coding assessments with AI face-tracking and cellphone scanning simulations. Click mock buttons to test webcam proctoring flags!",
      actionLabel: "⏱ Launch Proctoring OA",
      targetPath: "/demo/assessment/app-sarah/candidate-sarah"
    },
    {
      title: "4. LLaMA AI Interview (Notebook)",
      desc: "Take an autonomous technical interview guided by our simulated local LLaMA model, offering real-time verbal hints and grading criteria.",
      actionLabel: "🤖 Launch AI Interview",
      targetPath: "/demo/ai-interview/room-sarah-llama"
    },
    {
      title: "5. Shortlist & Offer (Employer)",
      desc: "Go back to the Employer view to inspect parsed skills, proctoring flag logs, AI chat transcripts, and generate an automated, elegant offer letter!",
      actionLabel: "📄 View Evaluated Candidates",
      targetPath: "/company"
    }
  ];

  const warpTo = (stepIndex) => {
    const step = steps[stepIndex];
    if (stepIndex === 0) {
      localStorage.setItem("role", "company");
      localStorage.setItem("userId", "demo-id");
    } else if (stepIndex === 1) {
      localStorage.setItem("role", "candidate");
      localStorage.setItem("userId", "candidate-sarah");
      localStorage.setItem("userName", "Sarah Jenkins");
    }
    
    if (stepIndex === 2) {
      window.open("http://localhost:5174/assessment/app-sarah/candidate-sarah", "_blank");
      return;
    }
    if (stepIndex === 3) {
      const params = new URLSearchParams({
        jobId: "job-aiml",
        appId: "app-sarah",
        candidateId: "candidate-sarah",
        jobTitle: "AI/ML Software Engineer",
        company: demoCompany || "HireSense",
        stage: "Technical Interview"
      });
      // Use the recruiter's unique roomId so the AI starts a brand new session
      window.open(`http://localhost:5179/room/${demoRoomId}?${params.toString()}`, "_blank");
      return;
    }

    navigate(step.targetPath);
  };

  const warpToRole = (jobTitle) => {
    localStorage.setItem("role", "candidate");
    localStorage.setItem("userId", "candidate-sarah");
    localStorage.setItem("userName", "Sarah Jenkins");
    
    const params = new URLSearchParams({
      jobId: "job-aiml",
      appId: "app-sarah",
      candidateId: "candidate-sarah",
      jobTitle: jobTitle,
      company: demoCompany || "HireSense",
      stage: "Technical Interview"
    });
    // Always use the recruiter's unique roomId
    window.open(`http://localhost:5179/room/${demoRoomId}?${params.toString()}`, "_blank");
  };

  const forceFastForward = (type) => {
    const apps = JSON.parse(localStorage.getItem("demo_applications") || "[]");
    const ints = JSON.parse(localStorage.getItem("demo_interviews") || "[]");

    if (type === "apply") {
      // Auto-schedule OA for Sarah
      const updated = apps.map(a => a._id === "app-sarah" ? { ...a, status: "Testing", oaStatus: "Scheduled" } : a);
      localStorage.setItem("demo_applications", JSON.stringify(updated));
      alert("Fast-forward: Sarah Jenkins has successfully applied to the AI/ML Job! Her proctored Online Assessment window is now scheduled and active.");
      navigate("/candidate");
    } else if (type === "oa") {
      // Auto-schedule LLaMA interview for Sarah
      const updatedApps = apps.map(a => a._id === "app-sarah" ? { ...a, status: "Interview", oaStatus: "Completed" } : a);
      localStorage.setItem("demo_applications", JSON.stringify(updatedApps));

      const hasInt = ints.some(i => i._id === "int-sarah-ai");
      if (!hasInt) {
        ints.push({
          _id: "int-sarah-ai",
          roomId: "room-sarah-llama",
          jobId: { title: "AI/ML Software Engineer" },
          candidateId: { _id: "candidate-sarah", name: "Sarah Jenkins" },
          stageName: "AI Technical Interview (DSA)",
          interviewMode: "AI",
          scheduledAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          status: "Scheduled"
        });
        localStorage.setItem("demo_interviews", JSON.stringify(ints));
      }
      alert("Fast-forward: Sarah Jenkins has finished her proctored OA with a 98% score! Her autonomous AI Technical Interview is now active and ready to start.");
      navigate("/candidate");
    } else if (type === "interview") {
      // Auto-evaluate LLaMA interview & unlock shortlist / offer for Sarah
      const updatedApps = apps.map(a => a._id === "app-sarah" ? { ...a, status: "Interview", aiScore: 92 } : a);
      localStorage.setItem("demo_applications", JSON.stringify(updatedApps));

      const updatedInts = ints.map(i => i._id === "int-sarah-ai" ? { ...i, status: "Completed" } : i);
      localStorage.setItem("demo_interviews", JSON.stringify(updatedInts));

      alert("Fast-forward: Sarah's AI Technical Interview is successfully graded (92% Score)! Head to the Employer dashboard to review her transcript, logs, and issue her Offer Letter.");
      localStorage.setItem("role", "company");
      localStorage.setItem("userId", "demo-id");
      localStorage.setItem("userName", "Demo Employer");
      navigate("/company");
    }
  };

  const endTour = async () => {
    if (window.confirm("End Demo? This will clear all sandbox data and return you to the home page.")) {
      clearInterval(timerRef.current);
      await cleanupDemoData();
      localStorage.clear();
      navigate("/");
      window.location.reload();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[1000] px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-indigo-500/35 hover:-translate-y-0.5 text-white font-bold rounded-2xl shadow-2xl flex items-center gap-2 border border-indigo-400/20 text-xs transition-all animate-bounce"
      >
        <span>⚙️</span> Show DEMO
        <span className={`text-[9px] font-mono ml-1 ${secondsLeft < 120 ? "text-red-300 animate-pulse" : "text-indigo-200"}`}>
          {formatTime(secondsLeft)}
        </span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-[1000] w-[380px] rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden animate-slideUp text-white flex flex-col font-sans"
      style={{
        background: "rgba(10, 10, 15, 0.85)",
        borderColor: "rgba(99, 102, 241, 0.25)",
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.7)"
      }}
    >
      {/* Tour Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-indigo-500/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-indigo-200 to-violet-300 bg-clip-text text-transparent">DEMO</h3>
            <p className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">
              {recruiterName}{demoCompany ? ` · ${demoCompany}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Countdown timer chip */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black font-mono ${
            secondsLeft < 120
              ? "bg-red-500/15 border-red-500/30 text-red-300 animate-pulse"
              : "bg-black/30 border-white/[0.08] text-indigo-300"
          }`}>
            <span>⏱</span> {formatTime(secondsLeft)}
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {/* Steps Content */}
      <div className="p-5 flex-1 max-h-[300px] overflow-y-auto space-y-4">
        {/* Step Selector Card */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4.5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-400">Current Showcase Phase</span>
            <span className="text-[11px] font-bold text-gray-500 bg-white/[0.05] px-2 py-0.5 rounded-full">{activeStep + 1} / 5</span>
          </div>

          <h4 className="font-bold text-sm text-white">{steps[activeStep].title}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{steps[activeStep].desc}</p>

          {activeStep === 3 ? (
            <div className="space-y-1.5 mt-2">
              <span className="text-[9px] uppercase font-black text-indigo-400 block mb-1">Choose a Target Job Role:</span>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => warpToRole("Machine Learning Engineer")}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 border border-cyan-400/20"
                >
                  🤖 Machine Learning Engineer
                </button>
                <button
                  onClick={() => warpToRole("Software Development Engineer (SDE)")}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 border border-indigo-400/20"
                >
                  💻 Software Dev Engineer (SDE)
                </button>
                <button
                  onClick={() => warpToRole("Full Stack Web Developer")}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 border border-violet-400/20"
                >
                  🌐 Full Stack Web Developer
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => warpTo(activeStep)}
              className="w-full mt-2 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all text-center flex items-center justify-center gap-1.5"
            >
              {steps[activeStep].actionLabel}
            </button>
          )}
        </div>

        {/* Horizontal Navigation Dots */}
        <div className="flex justify-center gap-2 py-1">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${
                activeStep === i ? "bg-indigo-500 w-6" : "bg-white/[0.12] hover:bg-white/[0.25]"
              }`}
              title={`Phase ${i + 1}`}
            />
          ))}
        </div>

        {/* Fast-Forward Shortcuts */}
        <div className="border-t border-white/[0.06] pt-4.5 space-y-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-violet-400 block mb-1">⏩ Sandbox Fast-Forward Shortcuts</span>
          
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => forceFastForward("apply")}
              className="py-2 px-3 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-left text-xs font-medium transition-all text-gray-300 hover:text-white flex justify-between items-center"
            >
              <span>1. Apply Sarah to AI Job</span>
              <span className="text-[9px] font-extrabold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded border border-violet-500/20">OA Invite</span>
            </button>

            <button
              onClick={() => forceFastForward("oa")}
              className="py-2 px-3 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-left text-xs font-medium transition-all text-gray-300 hover:text-white flex justify-between items-center"
            >
              <span>2. Pass Sarah's Proctored OA</span>
              <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">Interview</span>
            </button>

            <button
              onClick={() => forceFastForward("interview")}
              className="py-2 px-3 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-left text-xs font-medium transition-all text-gray-300 hover:text-white flex justify-between items-center"
            >
              <span>3. Auto-Evaluate LLaMA Round</span>
              <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">Issue Offer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="px-5 py-3 border-t border-white/[0.08] bg-black/[0.3] flex justify-between items-center text-xs">
        <button
          onClick={() => {
            localStorage.setItem("role", "company");
            localStorage.setItem("userId", "demo-id");
            localStorage.setItem("userName", "Demo Employer");
            navigate("/company");
          }}
          className="text-gray-400 hover:text-white font-semibold transition-colors"
        >
          🏢 Recruiter View
        </button>
        <button
          onClick={() => {
            localStorage.setItem("role", "candidate");
            localStorage.setItem("userId", "candidate-sarah");
            localStorage.setItem("userName", "Sarah Jenkins");
            navigate("/candidate");
          }}
          className="text-gray-400 hover:text-white font-semibold transition-colors"
        >
          👤 Candidate View
        </button>
        <button onClick={endTour} className="text-red-400 hover:text-red-300 font-extrabold transition-colors">
          Exit Demo
        </button>
      </div>
    </div>
  );
}
