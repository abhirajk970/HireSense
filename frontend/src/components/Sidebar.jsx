import { Link, useNavigate, useLocation } from "react-router-dom";

function Sidebar() {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
      localStorage.clear();
      navigate("/");
  };

  const candidateLinks = [
    { to: "/candidate", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z", label: "Dashboard" },
    { to: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "My Profile" },
    { to: "/practice", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", label: "DSA Practice" },
  ];

  const companyLinks = [
    { to: "/company", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "Dashboard" },
  ];

  const links = role === "candidate" ? candidateLinks : companyLinks;

  const comingSoonLinks = [
    { icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", label: "AI Interview" },
  ];

  return (
    <div className="w-64 h-screen text-white fixed shadow-2xl flex flex-col border-r" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>
      <Link to={role === 'candidate' ? '/candidate' : (role === 'company' ? '/company' : '/')} className="p-6 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer" style={{ borderBottom: '1px solid var(--border)' }}>
         <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
         </div>
         <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">HireSense</span>
      </Link>

      <div className="flex flex-col p-4 space-y-1.5 mt-2 flex-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold px-3 mb-2">Navigation</p>
        {links.map(link => {
          const isActive = location.pathname === link.to;
          return (
            <Link key={link.to} className={`flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-lg shadow-indigo-500/5' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'}`} to={link.to}>
              <svg className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon}></path></svg>
              {link.label}
            </Link>
          );
        })}

        <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold px-3 mb-2">Coming Soon</p>
          {comingSoonLinks.map((link, i) => (
            <div key={i} className="flex items-center px-4 py-3 rounded-xl text-sm text-gray-600 cursor-not-allowed">
              <svg className="w-5 h-5 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon}></path></svg>
              <span>{link.label}</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>Soon</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout} className="flex items-center justify-center w-full px-4 py-3 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl font-medium transition-all text-sm">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </button>
      </div>
    </div>
  );
}

export default Sidebar;