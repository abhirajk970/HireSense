import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function NotificationPanel({ userId, isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
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
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "oa_scheduled": return "🎯";
      case "oa_completed": return "✅";
      case "application_received": return "📩";
      case "shortlisted": return "⭐";
      default: return "🔔";
    }
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div ref={panelRef} className="absolute top-14 right-0 w-96 max-h-[480px] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <h3 className="font-bold text-[var(--text-primary)]">Notifications</h3>
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
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-2">🔔</div>
            <p className="text-[var(--text-muted)] text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n._id}
              onClick={() => !n.read && markAsRead(n._id)}
              className={`px-5 py-4 border-b border-[var(--border)] cursor-pointer transition-colors flex gap-3 ${
                n.read 
                  ? 'opacity-60 hover:opacity-80' 
                  : 'hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <div className="text-xl flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
