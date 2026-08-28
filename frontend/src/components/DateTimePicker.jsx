import { useState, useRef, useEffect, useCallback } from "react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_S = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function sameDay(a, b) {
  return a && b &&
    a.getDate()     === b.getDate()  &&
    a.getMonth()    === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

function parseISO(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDisplay(d) {
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  });
}

const POPOVER_W = 420;
const POPOVER_H = 430;

/**
 * DateTimePicker — professional calendar + time picker.
 *
 * The popover renders with position:fixed so it is never clipped by any
 * parent with overflow:auto/hidden (e.g. the Config Modal scroll area).
 *
 * Props:
 *   value       – ISO string or ""
 *   onChange    – fn(isoString | "")
 *   placeholder – string
 *   minDate     – Date (optional); days before it are disabled
 *   dark        – boolean; dark-glass style for dark modals
 */
export default function DateTimePicker({ value, onChange, placeholder = "Select date & time", minDate, dark = false }) {
  const parsed = parseISO(value);

  const [open, setOpen]           = useState(false);
  const [popPos, setPopPos]       = useState({ top: 0, left: 0, openAbove: false });
  const [viewMonth, setViewMonth] = useState(() => {
    const base = parsed || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(parsed);
  const [hour,   setHour]   = useState(parsed ? (parsed.getHours() % 12 || 12) : 10);
  const [minute, setMinute] = useState(parsed ? Math.round(parsed.getMinutes() / 5) * 5 % 60 : 0);
  const [ampm,   setAmpm]   = useState(parsed ? (parsed.getHours() >= 12 ? "PM" : "AM") : "AM");

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // ── Sync when external value changes ────────────────────────────────────
  useEffect(() => {
    const d = parseISO(value);
    if (d) {
      setSelectedDate(d);
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      setHour(d.getHours() % 12 || 12);
      setMinute(Math.round(d.getMinutes() / 5) * 5 % 60);
      setAmpm(d.getHours() >= 12 ? "PM" : "AM");
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // ── Calculate fixed position from trigger bounding rect ─────────────────
  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r   = triggerRef.current.getBoundingClientRect();
    const vH  = window.innerHeight;
    const vW  = window.innerWidth;

    const openAbove = (vH - r.bottom) < POPOVER_H && r.top > POPOVER_H;

    // Keep popover within horizontal viewport
    let left = r.left;
    if (left + POPOVER_W > vW - 8) left = vW - POPOVER_W - 8;
    if (left < 8) left = 8;

    setPopPos({
      top:       openAbove ? "auto"              : r.bottom + 6,
      bottom:    openAbove ? vH - r.top + 6      : "auto",
      left,
      openAbove,
    });
  }, []);

  // Recalculate on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    const onAny = () => calcPos();
    window.addEventListener("scroll",  onAny, true);   // capture — catches nested scroll
    window.addEventListener("resize",  onAny);
    return () => {
      window.removeEventListener("scroll",  onAny, true);
      window.removeEventListener("resize",  onAny);
    };
  }, [open, calcPos]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        open &&
        popoverRef.current  && !popoverRef.current.contains(e.target) &&
        triggerRef.current  && !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Open / close ─────────────────────────────────────────────────────────
  const handleOpen = () => {
    calcPos();
    setOpen(o => !o);
  };

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const year  = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const calDays = () => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < first; i++) out.push(null);
    for (let d = 1; d <= total; d++) out.push(new Date(year, month, d));
    return out;
  };

  const isDisabled = (date) => {
    if (!date) return true;
    if (!minDate) return false;
    const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()) < min;
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!selectedDate) return;
    const result = new Date(selectedDate);
    let h = hour % 12;
    if (ampm === "PM") h += 12;
    result.setHours(h, minute, 0, 0);
    onChange(result.toISOString());
    setOpen(false);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    setSelectedDate(null);
    setViewMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    onChange("");
    setOpen(false);
  };

  const today = new Date();
  const days  = calDays();

  // ── Theme tokens ──────────────────────────────────────────────────────────
  // For dark prop (JobApplicantsManager), we use explicit dark colors.
  // For the default (CompanyDashboard), we use CSS vars — but add solid
  // fallback values so the popover is always opaque even if data-theme isn't set.
  const bg     = dark ? "#111827"                 : "var(--bg-card-solid, #12121a)";
  const border = dark ? "rgba(255,255,255,0.1)"   : "var(--border, rgba(255,255,255,0.08))";
  const inputBg= dark ? "rgba(255,255,255,0.07)"  : "var(--bg-input, rgba(255,255,255,0.06))";
  const txtPri = dark ? "#f9fafb"                 : "var(--text-primary, #ffffff)";
  const txtMut = dark ? "#9ca3af"                 : "var(--text-muted, #6b7280)";
  const txtDim = dark ? "#4b5563"                 : "var(--text-dimmed, #374151)";

  const cellBase = "w-full aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center";

  return (
    <div className="relative select-none">
      {/* ── Trigger ─────────────────────────────────────────────────────── */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className="w-full border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all"
        style={{
          background: inputBg,
          borderColor: open ? "rgba(99,102,241,0.6)" : border,
          color: txtPri,
          boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#818cf8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span className={`text-sm truncate ${value ? "" : "opacity-40"}`} style={{ color: txtPri }}>
            {value ? fmtDisplay(parseISO(value)) : placeholder}
          </span>
        </div>
        {value ? (
          <button
            onClick={handleClear}
            className="ml-2 flex-shrink-0 rounded-md p-0.5 transition-colors hover:text-red-400"
            style={{ color: txtMut }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        ) : (
          <svg
            className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
            style={{ color: txtMut, transform: open ? "rotate(180deg)" : "none" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
          </svg>
        )}
      </div>

      {/* ── Popover — position:fixed so it escapes overflow:hidden parents ── */}
      {open && (
        <div
          ref={popoverRef}
          className="rounded-2xl border shadow-2xl overflow-hidden animate-slideUp"
          style={{
            position:  "fixed",
            zIndex:    99999,
            top:       popPos.openAbove ? "auto"       : popPos.top,
            bottom:    popPos.openAbove ? popPos.bottom : "auto",
            left:      popPos.left,
            minWidth:  `${POPOVER_W}px`,
            maxWidth:  `${POPOVER_W}px`,
            background: bg,
            borderColor: border,
            // No backdrop-filter — keeps it fully opaque regardless of parent context
          }}
        >
          <div className="flex">
            {/* ── Calendar ───────────────────────────────────────────────── */}
            <div className="p-4 flex-1">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-indigo-500/15"
                  style={{ color: "#818cf8" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <span className="font-extrabold text-sm" style={{ color: txtPri }}>
                  {MONTHS[month]} {year}
                </span>
                <button
                  onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-indigo-500/15"
                  style={{ color: "#818cf8" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_S.map(d => (
                  <div key={d} className="text-center text-[9px] font-extrabold uppercase tracking-widest py-1" style={{ color: txtDim }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((date, i) => {
                  if (!date) return <div key={`x${i}`} />;
                  const dis     = isDisabled(date);
                  const isSel   = sameDay(date, selectedDate);
                  const isTod   = sameDay(date, today);

                  return (
                    <button
                      key={date.toString()}
                      disabled={dis}
                      onClick={() => !dis && setSelectedDate(date)}
                      className={`${cellBase} ${dis ? "opacity-25 cursor-not-allowed" : "cursor-pointer"}`}
                      style={{
                        background:  isSel ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "transparent",
                        color:       isSel ? "#ffffff" : isTod ? "#818cf8" : txtMut,
                        boxShadow:   isSel ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
                        transform:   isSel ? "scale(1.1)" : "none",
                        outline:     isTod && !isSel ? "1.5px solid rgba(129,140,248,0.45)" : "none",
                        outlineOffset: "-1px",
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Today shortcut */}
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                <button
                  onClick={() => {
                    const t = new Date();
                    setSelectedDate(t);
                    setViewMonth(new Date(t.getFullYear(), t.getMonth(), 1));
                  }}
                  className="text-[11px] font-bold transition-colors hover:text-indigo-400 flex items-center gap-1"
                  style={{ color: txtMut }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  Jump to today
                </button>
              </div>
            </div>

            {/* ── Divider ─────────────────────────────────────────────────── */}
            <div className="w-px" style={{ background: border }} />

            {/* ── Time ────────────────────────────────────────────────────── */}
            <div className="p-4 flex flex-col items-center justify-between" style={{ minWidth: "118px" }}>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] mb-3" style={{ color: txtDim }}>Time</p>

              <div className="flex flex-col items-center gap-3 flex-1 justify-center w-full">
                <SpinBox
                  value={hour}
                  onUp={()   => setHour(h => (h % 12) + 1)}
                  onDown={()  => setHour(h => h === 1 ? 12 : h - 1)}
                  format={v  => String(v).padStart(2, "0")}
                  inputBg={inputBg} border={border} txtPri={txtPri}
                />

                <span className="font-black text-xl leading-none" style={{ color: txtMut }}>:</span>

                <SpinBox
                  value={minute}
                  onUp={()   => setMinute(m => (m + 5) % 60)}
                  onDown={()  => setMinute(m => m === 0 ? 55 : m - 5)}
                  format={v  => String(v).padStart(2, "0")}
                  inputBg={inputBg} border={border} txtPri={txtPri}
                />

                {/* AM / PM */}
                <div className="flex flex-col gap-1 w-full mt-1">
                  {["AM", "PM"].map(p => (
                    <button
                      key={p}
                      onClick={() => setAmpm(p)}
                      className="w-full py-1.5 rounded-xl text-xs font-extrabold transition-all"
                      style={{
                        background: ampm === p ? "linear-gradient(135deg,#6366f1,#7c3aed)" : inputBg,
                        color:      ampm === p ? "#ffffff" : txtMut,
                        border:     `1px solid ${ampm === p ? "transparent" : border}`,
                        boxShadow:  ampm === p ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="mt-3 text-center">
                  <p className="text-[10px] font-extrabold" style={{ color: "#818cf8" }}>
                    {String(hour).padStart(2,"0")}:{String(minute).padStart(2,"0")} {ampm}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="flex gap-2 p-3" style={{ borderTop: `1px solid ${border}` }}>
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:text-red-400"
              style={{ borderColor: border, color: txtMut, background: "transparent" }}
            >
              Clear
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedDate}
              className="flex-1 py-2 rounded-xl text-xs font-extrabold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                boxShadow:  selectedDate ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
              }}
            >
              {selectedDate
                ? `Confirm · ${MONTHS[selectedDate.getMonth()].slice(0,3)} ${selectedDate.getDate()}, ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")} ${ampm}`
                : "Pick a date first"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SpinBox ──────────────────────────────────────────────────────────────────
function SpinBox({ value, onUp, onDown, format, inputBg, border, txtPri }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onUp}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-indigo-500/15"
        style={{ color: "#818cf8" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"/>
        </svg>
      </button>
      <div
        className="w-12 h-10 rounded-xl flex items-center justify-center text-xl font-black"
        style={{ background: inputBg, color: txtPri, border: `1px solid ${border}` }}
      >
        {format(value)}
      </div>
      <button
        onClick={onDown}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-indigo-500/15"
        style={{ color: "#818cf8" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
    </div>
  );
}
