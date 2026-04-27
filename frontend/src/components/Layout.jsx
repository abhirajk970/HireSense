import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-lightbg">
      <Navbar />
      <div className="p-8">{children}</div>
    </div>
  );
}

export default Layout;