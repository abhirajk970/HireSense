import { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import DateTimePicker from "../components/DateTimePicker";

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function isSameDay(a, b) {
  return a.getDate() === b.getDate() &&
         a.getMonth() === b.getMonth() &&
         a.getFullYear() === b.getFullYear();
}

function fmtTime(d) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  const colors = {
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-500/20",
    violet: "from-violet-500 to-violet-600 shadow-violet-500/20",
    emerald:"from-emerald-500 to-teal-600 shadow-emerald-500/20",
    amber:  "from-amber-500 to-orange-500 shadow-amber-500/20",
  };
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg flex items-center justify-center flex-shrink-0`}>
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}/>
        </svg>
      </div>
      <div>
        <p className="text-2xl font-black t-text">{value}</p>
        <p className="text-xs t-text-muted font-semibold uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ── Interview Card ─────────────────────────────────────────────────────────────
function InterviewCard({ inv, now, onReschedule, compact = false }) {
  const sched    = new Date(inv.scheduledAt);
  const diffMins = (sched - now) / 60000;
  const isJoin   = diffMins <= 5 && diffMins > -60;
  const isExpired= diffMins <= -60;
  const isDone   = inv.status === "Completed";

  return (
    <div className={`rounded-xl border p-4 transition-all ${compact ? '' : 'hover:-translate-y-0.5'}`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold t-text text-sm truncate">{inv.candidateId?.name || "Candidate"}</p>
          <p className="text-xs text-indigo-400 font-medium truncate">{inv.jobId?.title}</p>
        </div>
        <span className={`ml-2 text-[9px] uppercase font-extrabold px-2 py-0.5 rounded border flex-shrink-0 ${
          isDone    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          isExpired ? "bg-red-500/10 text-red-400 border-red-500/20" :
          "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
        }`}>
          {isDone ? "Done" : isExpired ? "Expired" : inv.status}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs t-text-muted mb-3">
        <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>{fmtDate(sched)} · {fmtTime(sched)}</span>
      </div>

      <div className="text-[10px] font-semibold t-text-muted mb-3 flex gap-2 flex-wrap">
        <span className="bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-md border border-violet-500/20">{inv.stageName}</span>
        {inv.autoScheduled && <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">Auto-scheduled</span>}
      </div>

      {!isDone && !isExpired && (
        <div className="flex gap-2">
          <button
            onClick={() => onReschedule(inv)}
            className="flex-1 py-1.5 text-xs font-semibold rounded-lg border t-text-muted hover:border-indigo-500/30 hover:text-indigo-400 transition-all"
            style={{ borderColor: 'var(--border)' }}
          >
            Reschedule
          </button>
          <button
            disabled={!isJoin}
            onClick={() => window.open(`http://localhost:5178/room/${inv.roomId}?role=interviewer`, "_blank")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isJoin
                ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-white/[0.05] text-gray-500 cursor-not-allowed"
            }`}
          >
            {isJoin ? "Join Room" : "Opens 5 min prior"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function InterviewerDashboard() {
  const interviewerId = localStorage.getItem("userId");
  const userName      = localStorage.getItem("userName") || "Interviewer";

  const [interviews, setInterviews]       = useState([]);
  const [currentMonth, setCurrentMonth]   = useState(new Date());
  const [selectedDay, setSelectedDay]     = useState(new Date());
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newTime, setNewTime]             = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [reschLoading, setReschLoading]   = useState(false);
  const now = new Date();

  const fetchInterviews = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/interviewers/${interviewerId}/interviews`);
      setInterviews(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchInterviews(); }, []);

  // ── Calendar helpers ─────────────────────────────────────────────────────
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const getDays = () => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const days  = [];
    for (let i = 0; i < first; i++) days.push(null);
    for (let d = 1; d <= total; d++) days.push(new Date(year, month, d));
    return days;
  };

  const getForDay = (date) => {
    if (!date) return [];
    return interviews.filter(inv => isSameDay(new Date(inv.scheduledAt), date));
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const todayList    = interviews.filter(inv => isSameDay(new Date(inv.scheduledAt), now));
  const weekStart    = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd      = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const weekList     = interviews.filter(inv => { const d = new Date(inv.scheduledAt); return d >= weekStart && d <= weekEnd; });
  const completed    = interviews.filter(inv => inv.status === "Completed").length;
  const upcoming     = interviews.filter(inv => inv.status === "Scheduled" && new Date(inv.scheduledAt) > now);
  const upcomingNext = [...upcoming].sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)).slice(0, 6);
  const selectedList = getForDay(selectedDay);

  // ── Reschedule ───────────────────────────────────────────────────────────
  const handleReschedule = async () => {
    if (!newTime) return alert("Please pick a new date & time.");
    setReschLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/interviewers/${rescheduleTarget.roomId}/reschedule`, {
        newScheduledAt: newTime, rescheduleReason
      });
      setRescheduleTarget(null); setNewTime(""); setRescheduleReason("");
      await fetchInterviews();
    } catch (err) { alert("Failed: " + err.message); }
    finally { setReschLoading(false); }
  };

  const calDays = getDays();

  return (
    <DashboardLayout>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black t-text">Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, {userName.split(" ")[0]}</h1>
          <p className="text-sm t-text-muted mt-1">Here's your interview schedule at a glance.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold t-text">{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <p className="text-xs t-text-muted">{now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today"     value={todayList.length}  icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="indigo" />
        <StatCard label="This Week" value={weekList.length}   icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="violet" />
        <StatCard label="Completed" value={completed}         icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="emerald" />
        <StatCard label="Upcoming"  value={upcoming.length}   icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" color="amber" />
      </div>

      {/* ── Main Content: Calendar + Side Panel ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Calendar */}
        <div className="xl:col-span-3 rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black t-text">{MONTHS[month]} {year}</h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center border t-text-muted hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                style={{ borderColor: 'var(--border)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button onClick={() => setCurrentMonth(new Date())}
                className="px-3 h-8 rounded-lg text-xs font-bold border t-text-muted hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                style={{ borderColor: 'var(--border)' }}>Today</button>
              <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center border t-text-muted hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                style={{ borderColor: 'var(--border)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold t-text-dimmed uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const dayInvs   = getForDay(date);
              const isToday   = isSameDay(date, now);
              const isSelected= isSameDay(date, selectedDay);
              const hasPast   = dayInvs.some(inv => inv.status === "Completed");
              const hasUpcoming = dayInvs.some(inv => inv.status === "Scheduled");

              return (
                <button
                  key={date.toString()}
                  onClick={() => setSelectedDay(date)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-sm font-semibold group
                    ${isSelected ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105" :
                      isToday    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30" :
                      "hover:bg-white/[0.05] t-text-muted hover:t-text"}`}
                >
                  {date.getDate()}
                  {dayInvs.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {hasUpcoming && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-indigo-400"}`}/>}
                      {hasPast     && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/70" : "bg-emerald-400"}`}/>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 text-xs t-text-muted">
              <span className="w-2 h-2 rounded-full bg-indigo-400"/><span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs t-text-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-400"/><span>Completed</span>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Selected day header */}
          <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs t-text-muted font-semibold uppercase tracking-wider mb-1">
              {isSameDay(selectedDay, now) ? "Today" : fmtDate(selectedDay)}
            </p>
            <p className="font-black t-text text-lg">
              {selectedList.length === 0 ? "No interviews" : `${selectedList.length} interview${selectedList.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Interviews for selected day OR upcoming */}
          {selectedList.length > 0 ? (
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "60vh" }}>
              {selectedList.map(inv => (
                <InterviewCard key={inv._id} inv={inv} now={now} onReschedule={setRescheduleTarget} compact />
              ))}
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold t-text-muted uppercase tracking-wider mb-3">Next Up</p>
              {upcomingNext.length === 0 ? (
                <div className="rounded-xl border p-8 text-center t-text-dimmed text-sm" style={{ borderColor: 'var(--border)' }}>No upcoming interviews.</div>
              ) : (
                <div className="space-y-3">
                  {upcomingNext.map(inv => (
                    <InterviewCard key={inv._id} inv={inv} now={now} onReschedule={setRescheduleTarget} compact />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Reschedule Modal ─────────────────────────────────────────── */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => { setRescheduleTarget(null); setNewTime(""); setRescheduleReason(""); }}>
          <div className="rounded-2xl border p-6 w-full max-w-md shadow-2xl animate-slideUp"
            style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}>

            <h2 className="text-xl font-black t-text mb-1">Reschedule Interview</h2>
            <p className="text-xs t-text-muted mb-5">
              Moving interview with <span className="text-indigo-400 font-bold">{rescheduleTarget.candidateId?.name}</span> for <span className="text-violet-400 font-bold">{rescheduleTarget.stageName}</span>.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase t-text-muted mb-1.5">New Date & Time</label>
                <DateTimePicker
                  value={newTime}
                  onChange={setNewTime}
                  placeholder="Pick new interview time"
                  minDate={new Date()}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase t-text-muted mb-1.5">Reason (optional)</label>
                <textarea rows="2" value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Interviewer conflict, candidate request…"
                  className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setRescheduleTarget(null); setNewTime(""); setRescheduleReason(""); }}
                className="flex-1 py-3 rounded-xl font-semibold border t-text-muted transition-all hover:bg-white/[0.04] text-sm"
                style={{ borderColor: 'var(--border)' }}>Cancel</button>
              <button onClick={handleReschedule} disabled={!newTime || reschLoading}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {reschLoading ? "Saving…" : "Confirm & Notify Candidate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
