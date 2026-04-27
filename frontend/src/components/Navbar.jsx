function Navbar() {
  return (
    <div className="bg-secondary text-white px-6 py-4 flex justify-between">
      <h1 className="text-xl font-bold">HireSense</h1>
      <div className="space-x-4">
        <a href="/candidate">Dashboard</a>
        <a href="/">Logout</a>
      </div>
    </div>
  );
}

export default Navbar;