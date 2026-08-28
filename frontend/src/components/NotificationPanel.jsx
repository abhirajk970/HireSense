import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// SVG icon paths keyed by notification type
const TYPE_ICON = {
  oa_scheduled:          "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  oa_completed:          "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  application_received:  "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  interview_scheduled:   "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  interview_reminder:    "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  shortlisted:           "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
};

const TYPE_COLOR = {
  oa_scheduled:         { bg: "bg-indigo-500/10",  text: "text-indigo-400",  border: "border-indigo-500/15" },
  oa_completed:         { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/15" },
  application_received: { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/15" },
  interview_scheduled:  { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/15" },
  interview_reminder:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/15" },
  shortlisted:          { bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/15" },
};

const defaultStyle = { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/15" };
const defaultIcon  = "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";

export default function NotificationPanel({ userId, isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    const fetchNotifs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/notifications/${userId}`);
        setNotifications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, [isOpen, userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60)    return "just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div ref={panelRef} className="absolute top-14 right-0 w-96 max-h-[480px] border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-slideUp" style={{ background: 'var(--bg-card-solid, #12121a)', borderColor: 'var(--border, rgba(255,255,255,0.08))' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-bold text-sm t-text">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllRead} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
              <svg className="w-5 h-5 t-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={defaultIcon}/>
              </svg>
            </div>
            <p className="t-text-muted text-sm font-medium">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => {
            const style = TYPE_COLOR[n.type] || defaultStyle;
            const iconPath = TYPE_ICON[n.type] || defaultIcon;
            return (
              <div
                key={n._id}
                onClick={() => {
                  if (!n.read) markAsRead(n._id);
                  if (n.type === 'offer_extended' && n.relatedJobId) {
                    onClose();
                    navigate(`/offer/${n.relatedJobId}`);
                  }
                }}
                className={`px-4 py-3.5 border-b cursor-pointer transition-all flex gap-3 ${
                  n.read ? 'opacity-60 hover:opacity-80' : 'hover:bg-white/[0.025]'
                }`}
                style={{ borderColor: 'var(--border)' }}
              >
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${style.bg} ${style.border} mt-0.5`}>
                  <svg className={`w-3.5 h-3.5 ${style.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath}/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm t-text truncate">{n.title}</p>
                    {!n.read && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs t-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] t-text-dimmed mt-1.5 font-medium">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
