import { Link, useNavigate, useLocation } from "react-router-dom";

const settingsIcon = "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z";

function Sidebar() {
  const role     = localStorage.getItem("role");
  const name     = localStorage.getItem("userName") || "";
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const candidateLinks = [
    { to: "/candidate", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z", label: "Dashboard" },
    { to: "/profile",   icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "My Profile" },
    { to: "/practice",  icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", label: "DSA Practice" },
    { to: "http://localhost:5180", icon: "M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "AI Interview Practice" },
    { to: "/settings",  icon: settingsIcon, label: "Settings" },
  ];

  const companyLinks = [
    { to: "/company",  icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "Dashboard" },
    { to: "/settings", icon: settingsIcon, label: "Settings" },
  ];

  const interviewerLinks = [
    { to: "/interviewer", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "My Schedule" },
    { to: "/settings",   icon: settingsIcon, label: "Settings" },
  ];

  const links =
    role === "candidate"   ? candidateLinks :
    role === "interviewer" ? interviewerLinks :
    companyLinks;

  const homeRoute =
    role === "candidate"   ? "/candidate" :
    role === "interviewer" ? "/interviewer" :
    role === "company"     ? "/company" : "/";

  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="w-64 h-screen text-white fixed shadow-2xl flex flex-col border-r" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
      {/* Logo */}
      <Link to={homeRoute} className="p-5 flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">HireSense</span>
      </Link>

      {/* Nav links */}
      <div className="flex flex-col p-3 space-y-0.5 mt-2 flex-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold px-3 mb-2">Navigation</p>
        {links.map(link => {
          const isExternal = link.to.startsWith("http");
          const isActive = location.pathname === link.to;
          const className = `flex items-center px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
            isActive ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`;

          if (isExternal) {
            return (
              <a
                key={link.to}
                className={className}
                href={link.to}
                target="_blank"
                rel="noreferrer"
              >
                <svg className="w-4.5 h-4.5 mr-3 flex-shrink-0 text-gray-600" style={{ width: '1.1rem', height: '1.1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon}/>
                </svg>
                {link.label}
              </a>
            );
          }

          return (
            <Link
              key={link.to}
              className={className}
              to={link.to}
            >
              <svg className={`w-4.5 h-4.5 mr-3 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-600'}`} style={{ width: '1.1rem', height: '1.1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon}/>
              </svg>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* User badge + logout */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{name || "Account"}</p>
            <p className="text-[10px] text-gray-500 capitalize">{role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center justify-center w-full px-3 py-2 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl font-medium transition-all text-sm mt-1">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;