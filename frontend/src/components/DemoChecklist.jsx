import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ── Checklist items ────────────────────────────────────────────────────────────
// Each item has: id, label, description, icon, action (fn or null), autoPage (route pattern)
const ITEMS = [
  {
    id: "employer_dashboard",
    label: "Explore Employer Dashboard",
    desc: "See the full hiring pipeline: jobs, applicants, and analytics",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.25)",
    route: "/company",
  },
  {
    id: "view_candidate",
    label: "Review a Candidate Profile",
    desc: "AI-parsed resume, skills, NLP entities, and fit score",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.25)",
    route: "/company",
  },
  {
    id: "post_job",
    label: "Post a Job Opening",
    desc: "Create a role with custom requirements and pipeline stages",
    icon: "M12 4v16m8-8H4",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.12)",
    border: "rgba(6,182,212,0.25)",
    route: "/company",
  },
  {
    id: "proctored_oa",
    label: "Run a Proctored Assessment",
    desc: "Take the AI-monitored online exam as a candidate",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
    external: true,
    url: "http://localhost:5174/assessment/app-sarah/candidate-sarah",
  },
  {
    id: "ai_interview",
    label: "Experience the AI Interview",
    desc: "3-stage SDE interview: Intro → DSA → Leadership Principles",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    color: "#a855f7",
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.25)",
    external: true,
    url: () => {
      const params = new URLSearchParams({
        jobId: "job-aiml", appId: "app-sarah", candidateId: "candidate-sarah",
        jobTitle: "Software Development Engineer (SDE)", company: "HireSense", stage: "Technical Interview"
      });
      return `http://localhost:5179/room/room-sarah-llama?${params.toString()}`;
    }
  },
  {
    id: "scorecard",
    label: "View AI Scorecard",
    desc: "See how candidates are automatically scored across all rounds",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
    route: "/company",
  },
  {
    id: "offer_letter",
    label: "Generate an Offer Letter",
    desc: "Issue a branded, personalised offer letter with one click",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
    route: "/company",
  },
  {
    id: "dsa_practice",
    label: "Try the DSA Practice Arena",
    desc: "Solve problems in the embedded Monaco editor with hints",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    color: "#f97316",
    bg: "rgba(249,115,22,0.12)",
    border: "rgba(249,115,22,0.25)",
    external: true,
    url: "http://localhost:5174/practice",
  },
];

const STORAGE_KEY = "demo_checklist_v1";

function loadChecked() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveChecked(ids) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
}

export default function DemoChecklist() {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(loadChecked);
  const [justCompleted, setJustCompleted] = useState(null);
  const [minimized, setMinimized] = useState(false);

  const isDemoMode = localStorage.getItem("demoMode") === "true";
  const recruiterName = localStorage.getItem("userName") || "Recruiter";

  // Auto-mark pages based on current route
  useEffect(() => {
    const path = location.pathname;
    let toMark = null;
    if (path === "/company") toMark = "employer_dashboard";
    if (path === "/practice") toMark = "dsa_practice";
    if (toMark && !checked.includes(toMark)) {
      markDone(toMark);
    }
  }, [location.pathname]); // eslint-disable-line

  useEffect(() => { saveChecked(checked); }, [checked]);

  // Auto-open on first mount in demo mode
  useEffect(() => {
    if (isDemoMode && checked.length === 0) {
      setTimeout(() => setOpen(true), 1200);
    }
  }, []); // eslint-disable-line

  const markDone = useCallback((id) => {
    setChecked(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveChecked(next);
      return next;
    });
    setJustCompleted(id);
    setTimeout(() => setJustCompleted(null), 2500);
  }, []);

  const handleItemClick = (item) => {
    if (item.external) {
      const url = typeof item.url === "function" ? item.url() : item.url;
      window.open(url, "_blank");
    } else if (item.route) {
      navigate(item.route);
    }
    // Mark done optimistically (page-visit auto-mark handles route items)
    setTimeout(() => markDone(item.id), 800);
  };

  const completedCount = checked.length;
  const totalCount = ITEMS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  if (!isDemoMode) return null;

  // ── Minimized FAB ────────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setMinimized(false); }}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          border: "none", borderRadius: "20px",
          padding: "12px 18px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
          color: "white", fontFamily: "inherit",
          animation: "pulse-glow 2.5s infinite",
        }}
      >
        {/* Progress ring */}
        <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
          <svg width="36" height="36" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke="white" strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - progressPct / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>
            {completedCount}/{totalCount}
          </span>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "-0.02em" }}>Demo Checklist</div>
          <div style={{ fontSize: "10px", opacity: 0.75 }}>{progressPct}% complete</div>
        </div>
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 8px 32px rgba(99,102,241,0.4); }
            50% { box-shadow: 0 8px 48px rgba(99,102,241,0.65); }
          }
        `}</style>
      </button>
    );
  }

  // ── Full panel ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
      width: "340px",
      background: "rgba(8,8,14,0.97)",
      border: "1px solid rgba(99,102,241,0.2)",
      borderRadius: "20px",
      boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)",
      fontFamily: "Inter, system-ui, sans-serif",
      overflow: "hidden",
      animation: "slide-up-panel 0.35s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <style>{`
        @keyframes slide-up-panel {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes check-pop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes just-done-glow {
          0%   { background: rgba(52,211,153,0.25); }
          100% { background: transparent; }
        }
        .demo-item:hover { background: rgba(255,255,255,0.03) !important; }
        .demo-item-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px 18px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
      }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}>
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                Demo Checklist
              </div>
              <div style={{ fontSize: 10, color: "rgba(139,92,246,0.9)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Hi {recruiterName.split(" ")[0]} 👋
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4, borderRadius: 6, display: "flex" }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: "linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7)",
              width: `${progressPct}%`,
              transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
              boxShadow: "0 0 8px rgba(139,92,246,0.6)",
            }}/>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", minWidth: 36 }}>
            {completedCount}/{totalCount}
          </span>
        </div>

        {progressPct === 100 && (
          <div style={{
            marginTop: 10, padding: "8px 12px", borderRadius: 10,
            background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)",
            fontSize: 11, fontWeight: 700, color: "#34d399", textAlign: "center",
          }}>
            🎉 Tour Complete! You've seen everything HireSense can do.
          </div>
        )}
      </div>

      {/* Items list */}
      <div style={{ maxHeight: "420px", overflowY: "auto", padding: "10px 10px 12px" }}>
        {ITEMS.map((item, idx) => {
          const done = checked.includes(item.id);
          const isJust = justCompleted === item.id;
          return (
            <div
              key={item.id}
              className="demo-item"
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 10px", borderRadius: 12, marginBottom: 4,
                cursor: "pointer", transition: "background 0.15s",
                background: isJust ? "rgba(52,211,153,0.1)" : "transparent",
                animation: isJust ? "just-done-glow 2.5s ease-out" : "none",
                border: `1px solid ${done ? "rgba(255,255,255,0.04)" : "transparent"}`,
              }}
              onClick={() => !done && handleItemClick(item)}
            >
              {/* Check bubble */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "rgba(52,211,153,0.15)" : item.bg,
                border: `1.5px solid ${done ? "rgba(52,211,153,0.35)" : item.border}`,
                transition: "all 0.3s ease",
              }}>
                {done ? (
                  <svg width="13" height="13" fill="none" stroke="#34d399" strokeWidth="2.5" viewBox="0 0 24 24"
                    style={{ animation: isJust ? "check-pop 0.4s cubic-bezier(0.16,1,0.3,1)" : "none" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" fill="none" stroke={item.color} strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                  </svg>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)",
                  textDecoration: done ? "line-through" : "none",
                  marginBottom: 2, letterSpacing: "-0.01em",
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.45 }}>
                  {item.desc}
                </div>
              </div>

              {/* Go button */}
              {!done && (
                <button
                  className="demo-item-btn"
                  onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                  style={{
                    flexShrink: 0, padding: "4px 10px", borderRadius: 8, fontSize: 10,
                    fontWeight: 800, border: "none", cursor: "pointer",
                    background: item.bg, color: item.color,
                    transition: "all 0.15s",
                    letterSpacing: "0.02em",
                  }}
                >
                  {item.external ? "↗ Open" : "→ Go"}
                </button>
              )}

              {/* Step number badge */}
              {!done && (
                <div style={{
                  position: "absolute", right: 52, fontSize: 9,
                  color: "rgba(255,255,255,0.18)", fontWeight: 700,
                }}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>
          Items auto-check as you navigate
        </span>
        {completedCount > 0 && (
          <button
            onClick={() => { setChecked([]); saveChecked([]); }}
            style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
