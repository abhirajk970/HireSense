import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// SVG icons — no emojis
const icons = {
  brain: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  lock:  "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  brief: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
};

function Home() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterCompany, setRecruiterCompany] = useState("");
  const [demoFormError, setDemoFormError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Generate a unique demo room ID per recruiter so each session is completely fresh
  const buildDemoRoomId = (name, company) => {
    const slug = `${name}-${company}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    return `demo-${slug}-${Date.now()}`;
  };

  const handleStartDemo = () => {
    if (!recruiterName.trim() || !recruiterCompany.trim()) {
      setDemoFormError("Please fill in both fields to begin.");
      return;
    }
    const roomId = buildDemoRoomId(recruiterName.trim(), recruiterCompany.trim());
    localStorage.setItem("demoMode", "true");
    localStorage.setItem("role", "company");
    localStorage.setItem("userId", "demo-id");
    localStorage.setItem("userName", recruiterName.trim());
    localStorage.setItem("demoCompany", recruiterCompany.trim());
    localStorage.setItem("demoRoomId", roomId);
    setShowDemoModal(false);
    navigate("/company");
  };

  const launchDemoOA = () => {
    localStorage.setItem("demoMode", "true");
    localStorage.setItem("role", "candidate");
    localStorage.setItem("userId", "candidate-sarah");
    localStorage.setItem("userName", "Sarah Jenkins");
    window.open("http://localhost:5174/assessment/app-sarah/candidate-sarah", "_blank");
  };

  const launchDemoAI = () => {
    localStorage.setItem("demoMode", "true");
    localStorage.setItem("role", "candidate");
    localStorage.setItem("userId", "candidate-sarah");
    localStorage.setItem("userName", "Sarah Jenkins");
    const params = new URLSearchParams({
      jobId: "job-aiml",
      appId: "app-sarah",
      candidateId: "candidate-sarah",
      jobTitle: "AI/ML Software Engineer",
      company: "HireSense",
      stage: "Technical Interview"
    });
    window.open(`http://localhost:5179/room/room-sarah-llama?${params.toString()}`, "_blank");
  };

  const launchDemoAIWithRole = (jobTitle) => {
    localStorage.setItem("demoMode", "true");
    localStorage.setItem("role", "candidate");
    localStorage.setItem("userId", "candidate-sarah");
    localStorage.setItem("userName", "Sarah Jenkins");
    const params = new URLSearchParams({
      jobId: "job-aiml",
      appId: "app-sarah",
      candidateId: "candidate-sarah",
      jobTitle: jobTitle,
      company: "HireSense",
      stage: "Technical Interview"
    });
    window.open(`http://localhost:5179/room/room-sarah-llama?${params.toString()}`, "_blank");
    setShowRoleSelect(false);
  };

  const features = [
    { icon: icons.brain, title: "AI Resume Parsing",       desc: "Intelligent skill extraction and semantic job matching" },
    { icon: icons.lock,  title: "Proctored Assessments",   desc: "Vision AI monitoring with face and activity detection" },
    { icon: icons.chart, title: "Smart Shortlisting",      desc: "Automated pipeline with weighted candidate scoring" },
    { icon: icons.brief, title: "Multi-stage Workflow",    desc: "Configurable hiring pipeline with auto-advance rules" },
  ];

  const portalBtnBase = "group relative flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5";

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/12 rounded-full blur-[140px]" />
      <div className="absolute top-[45%] right-[25%] w-[280px] h-[280px] bg-cyan-500/8 rounded-full blur-[100px]" />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">HireSense</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/login/candidate")} className="px-4 py-2 text-sm font-semibold t-text-muted hover:t-text transition-colors rounded-lg hover:bg-white/[0.04]">
            Candidate
          </button>
          <button onClick={() => navigate("/login/company")} className="px-4 py-2 text-sm font-semibold t-text-muted hover:t-text transition-colors rounded-lg hover:bg-white/[0.04]">
            Employer
          </button>
          <button onClick={() => navigate("/login/interviewer")} className="px-4 py-2 text-sm font-semibold t-text-muted hover:t-text transition-colors rounded-lg hover:bg-white/[0.04]">
            Interviewer
          </button>
          <button onClick={() => navigate("/register/candidate")} className="ml-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all hover:border-indigo-500/40 hover:text-indigo-400" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className={`relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-16 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="text-center max-w-4xl mx-auto">

          {/* Status badge — no "powered by AI", replaced with version pill */}
          <div className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 mb-10 backdrop-blur-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold t-text-muted tracking-wider uppercase">Now Live — HireSense Platform</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
            Hire Smarter with
            <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent mt-2">
              AI-Driven Precision
            </span>
          </h1>

          <p className="text-lg max-w-2xl mx-auto mb-14 leading-relaxed t-text-muted">
            From intelligent resume parsing to proctored coding assessments — HireSense automates your entire hiring pipeline with machine learning at every stage.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-20">
            {/* Demo CTA */}
            <button onClick={() => setShowDemoModal(true)} className={`${portalBtnBase} text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 border border-cyan-400/25`} style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </span>
              <span className="font-black text-sm">▶ Demo</span>
              <svg className="w-4 h-4 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>

            {/* Candidate */}
            <button onClick={() => navigate("/login/candidate")} className={`${portalBtnBase} border`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-input)' }}>
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </span>
              <span className="t-text">Candidate Login</span>
              <svg className="w-4 h-4 t-text-muted group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>

            {/* Employer */}
            <button onClick={() => navigate("/login/company")} className={`${portalBtnBase} border`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-input)' }}>
                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </span>
              <span className="t-text">Employer Login</span>
              <svg className="w-4 h-4 t-text-muted group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>

            {/* Interviewer */}
            <button onClick={() => navigate("/login/interviewer")} className={`${portalBtnBase} border`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-input)' }}>
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </span>
              <span className="t-text">Interviewer Login</span>
              <svg className="w-4 h-4 t-text-muted group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>
          </div>
        </div>

        {/* Feature cards — SVG icons instead of emojis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <div
              key={i}
              className={`border rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 t-card t-card-hover ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${200 + i * 80}ms` }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/15 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={f.icon}/>
                </svg>
              </div>
              <h3 className="font-bold mb-1.5 t-text text-sm">{f.title}</h3>
              <p className="text-sm leading-relaxed t-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recruiter Sandbox Hub */}
      <div className={`relative z-10 max-w-5xl mx-auto px-8 py-16 border rounded-3xl backdrop-blur-xl mb-12 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
           style={{ background: 'rgba(10, 10, 15, 0.4)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
        
        {/* Background highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-3xl -z-10" />

        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[10px] tracking-widest font-extrabold text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">DEMO PLAYGROUND</span>
          <h2 className="text-3xl md:text-4xl font-black mt-4 mb-3 t-text">HireSense Interactive Demo</h2>
          <p className="text-sm t-text-muted leading-relaxed">
            Test the entire candidate screening, secure proctoring, and LLaMA voice assessment platform immediately without logging in. Choose a path below to teleport into active mock sessions:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Employer */}
          <div className="p-6 rounded-2xl border bg-white/[0.01] border-white/[0.05] hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <h3 className="font-extrabold text-sm mb-1.5 t-text">🏢 1. Employer Dashboard</h3>
              <p className="text-xs t-text-muted leading-relaxed mb-6">Create custom screening roles, review real-time proctoring alert logs, AI evaluation scores, and issue elegant offers.</p>
            </div>
            <button onClick={() => setShowDemoModal(true)} className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-500/10 group-hover:bg-indigo-500 text-indigo-300 group-hover:text-white transition-all text-center border border-indigo-500/20">
              Open Demo →
            </button>
          </div>

          {/* Card 2: Proctored OA */}
          <div className="p-6 rounded-2xl border bg-white/[0.01] border-white/[0.05] hover:border-cyan-500/30 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <h3 className="font-extrabold text-sm mb-1.5 t-text">⏱ 2. Proctoring Exam Sandbox</h3>
              <p className="text-xs t-text-muted leading-relaxed mb-6">Simulate suspicious candidate behavior (cell phone, tab switches, face absence) to see the vision proctoring engine trigger warnings in real-time.</p>
            </div>
            <button onClick={launchDemoOA} className="w-full py-2.5 rounded-xl font-bold text-xs bg-cyan-500/10 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-white transition-all text-center border border-cyan-500/20">
              Launch Proctoring OA →
            </button>
          </div>

          {/* Card 3: AI Interview */}
          <div className="p-6 rounded-2xl border bg-white/[0.01] border-white/[0.05] hover:border-violet-500/30 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/25 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              </div>
              <h3 className="font-extrabold text-sm mb-1.5 t-text">🤖 3. LLaMA Technical Room</h3>
              <p className="text-xs t-text-muted leading-relaxed mb-6">Interact with our autonomous technical interviewer. Use Monaco editor to write algorithms and request dynamic hints with voice speech synthesis.</p>
            </div>
            {showRoleSelect ? (
              <div className="space-y-1.5 mt-2">
                <span className="text-[10px] text-indigo-400 font-extrabold block uppercase tracking-wider">Choose a Target Job Role:</span>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => launchDemoAIWithRole("Machine Learning Engineer")}
                          className="w-full py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-center border border-cyan-400/20 hover:-translate-y-0.5 transition-all">
                    🤖 Machine Learning Engineer
                  </button>
                  <button onClick={() => launchDemoAIWithRole("Software Development Engineer (SDE)")}
                          className="w-full py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-center border border-indigo-400/20 hover:-translate-y-0.5 transition-all">
                    💻 Software Engineer (SDE)
                  </button>
                  <button onClick={() => launchDemoAIWithRole("Full Stack Web Developer")}
                          className="w-full py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-center border border-violet-400/20 hover:-translate-y-0.5 transition-all">
                    🌐 Full Stack Web Developer
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowRoleSelect(true)} className="w-full py-2.5 rounded-xl font-bold text-xs bg-violet-500/10 group-hover:bg-violet-500 text-violet-300 group-hover:text-white transition-all text-center border border-violet-500/20">
                Launch AI Interview Room →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline preview */}
      <div className={`relative z-10 max-w-5xl mx-auto px-8 py-20 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2 t-text">Complete Hiring Pipeline</h2>
          <p className="text-sm t-text-muted">Every stage, from application to offer — automated by intelligence.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {["Resume Upload", "AI Parsing", "Skill Matching", "Assignment Round", "DSA Assessment", "AI Interview", "Offer"].map((step, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${i <= 5 ? 't-accent' : ''}`}
                style={i > 5 ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}}
              >
                {step}
              </div>
              {i < 6 && (
                <svg className="w-4 h-4 mx-1 t-text-dimmed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Demo Entry Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowDemoModal(false)}>
          <div
            className="relative w-[420px] rounded-3xl border p-8 shadow-2xl animate-slideUp"
            style={{ background: "rgba(10,10,15,0.95)", borderColor: "rgba(99,102,241,0.25)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-b-full opacity-70" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <h3 className="font-black text-lg text-white leading-tight">Start Demo</h3>
                <p className="text-[10px] text-indigo-400 font-black tracking-widest uppercase">HireSense Recruiter Sandbox</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              We'll create a fresh, isolated sandbox session just for you — your name and company personalise the demo and ensure the AI interview system starts from scratch.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Your Name</label>
                <input
                  type="text"
                  value={recruiterName}
                  onChange={e => { setRecruiterName(e.target.value); setDemoFormError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleStartDemo()}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  value={recruiterCompany}
                  onChange={e => { setRecruiterCompany(e.target.value); setDemoFormError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleStartDemo()}
                  placeholder="e.g. Acme Technologies"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>

            {demoFormError && (
              <p className="text-xs text-red-400 font-semibold mb-4">{demoFormError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition border border-white/[0.06] hover:border-white/[0.12]"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDemo}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                Start My Demo Session →
              </button>
            </div>

            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs t-text-dimmed tracking-wide">© 2026 HireSense Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
