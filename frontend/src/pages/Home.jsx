import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Home() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { icon: "🧠", title: "AI Resume Parsing", desc: "Intelligent skill extraction & semantic matching" },
    { icon: "🔒", title: "Proctored Assessments", desc: "Vision AI with face & phone detection" },
    { icon: "📊", title: "Smart Shortlisting", desc: "Automated pipeline with weighted scoring" },
    { icon: "💼", title: "Company Pipeline", desc: "Multi-stage hiring workflow management" },
  ];

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Animated gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}} />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">HireSense</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login/candidate")} className="px-5 py-2.5 text-sm font-semibold t-text-muted hover:t-text transition-colors">Sign In</button>
          <button onClick={() => navigate("/register/candidate")} className="px-5 py-2.5 text-sm font-semibold rounded-xl backdrop-blur-sm transition-all border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <div className={`relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-16 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium t-text-muted">Powered by Advanced AI</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
            Hire Smarter with
            <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              AI-Driven Precision
            </span>
          </h1>
          
          <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed t-text-muted">
            From intelligent resume parsing to proctored coding assessments — HireSense automates your hiring pipeline with cutting-edge machine learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button onClick={() => navigate("/login/candidate")} className="group px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-bold text-lg text-white shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5">
              I'm a Candidate
              <svg className="w-5 h-5 inline ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>
            <button onClick={() => navigate("/login/company")} className="group px-8 py-4 border rounded-xl font-bold text-lg backdrop-blur-sm transition-all hover:-translate-y-0.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              I'm an Employer
              <svg className="w-5 h-5 inline ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <div key={i} className={`group border rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 t-card t-card-hover ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{transitionDelay: `${300 + i*100}ms`}}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold mb-1.5 t-text">{f.title}</h3>
              <p className="text-sm leading-relaxed t-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline preview */}
      <div className={`relative z-10 max-w-5xl mx-auto px-8 py-20 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3 t-text">Complete Hiring Pipeline</h2>
          <p className="t-text-muted">Every stage, from application to offer — powered by intelligence.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {["Resume Upload", "AI Parsing", "Skill Matching", "MCQ Round", "DSA Assessment", "AI Interview", "Offer"].map((step, i) => (
            <div key={i} className="flex items-center">
              <div className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${i <= 4 ? 't-accent' : ''}`} style={i > 4 ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}}>
                {step}
                {i === 5 && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>Soon</span>}
              </div>
              {i < 6 && <svg className="w-4 h-4 mx-1 t-text-dimmed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>}
            </div>
          ))}
        </div>
      </div>

      {/* Footer — Feature 4: removed "built with AI" text */}
      <footer className="relative z-10 py-8 text-center border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm t-text-dimmed">© 2026 HireSense. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
