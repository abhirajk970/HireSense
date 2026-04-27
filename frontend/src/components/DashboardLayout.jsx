import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen">
        <Topbar />
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </div>
    </div>
  );
}

export default DashboardLayout;