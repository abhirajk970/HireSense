import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import NotificationPanel from "./NotificationPanel";

function Topbar() {
  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("userName") || (role === 'candidate' ? 'Candidate' : 'Employer');
  const userId = localStorage.getItem("userId");
  const initial = userName.charAt(0).toUpperCase();

  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const fetchCount = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/notifications/${userId}/unread-count`);
        setUnreadCount(res.data.count);
      } catch (err) { /* silent */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleToggleTheme = () => {
    const html = document.documentElement;
    const current = html.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <div className="bg-[var(--bg-topbar)] backdrop-blur-xl sticky top-0 z-10 border-b border-[var(--border)] p-4 px-8 flex justify-between items-center h-16">
      <div className="flex items-center gap-3">
         <div className={`w-2 h-2 rounded-full ${role === 'candidate' ? 'bg-indigo-400' : 'bg-violet-400'} shadow-lg ${role === 'candidate' ? 'shadow-indigo-400/50' : 'shadow-violet-400/50'}`}></div>
         <span className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-[0.15em]">
            {role === "candidate" ? "Candidate Portal" : "Employer Portal"}
         </span>
      </div>
      
      <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button onClick={handleToggleTheme} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-card)]" title="Toggle theme">
            <svg className="w-5 h-5 hidden dark-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <svg className="w-5 h-5" id="theme-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) setUnreadCount(0); }} className="relative text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-card)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel userId={userId} isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
          </div>

          <Link to={role === 'candidate' ? '/profile' : '#'} className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 transition-all">
             {initial}
          </Link>
      </div>
    </div>
  );
}

export default Topbar;