import { useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";

function Login() {
  const { role } = useParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password
      });

      if (res.data.role !== role) {
          setError(`You are registered as a ${res.data.role}. Please log in through the correct portal.`);
          setLoading(false);
          return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("userName", res.data.name || (res.data.role === 'candidate' ? 'Candidate' : 'Employer'));

      res.data.role === "candidate"
        ? navigate("/candidate")
        : navigate("/company");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
      setLoading(false);
    }
  };

  const isCandidate = role === "candidate";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background effects */}
      <div className={`absolute top-[-20%] ${isCandidate ? 'left-[-10%]' : 'right-[-10%]'} w-[500px] h-[500px] ${isCandidate ? 'bg-indigo-600/15' : 'bg-violet-600/15'} rounded-full blur-[120px]`} />
      <div className="absolute bottom-[-20%] right-[20%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-10 group">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">HireSense</span>
        </Link>

        <div className="rounded-2xl p-8 backdrop-blur-xl shadow-2xl border" style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--border)' }}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 ${isCandidate ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-violet-500/10 border-violet-500/20'} border rounded-full px-3 py-1 mb-4`}>
              <span className={`w-1.5 h-1.5 ${isCandidate ? 'bg-indigo-400' : 'bg-violet-400'} rounded-full`} />
              <span className={`text-xs font-semibold ${isCandidate ? 'text-indigo-300' : 'text-violet-300'} uppercase tracking-wider`}>{isCandidate ? 'Candidate' : 'Employer'} Portal</span>
            </div>
            <h1 className="text-2xl font-bold mb-1 t-text">Welcome back</h1>
            <p className="text-sm t-text-muted">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="t-danger border p-3 rounded-xl mb-6 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 t-text-muted">Email Address</label>
              <input required type="email" className="w-full t-input border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 t-text-muted">Password</label>
              <input required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                type="password" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button type="submit" disabled={loading}
              className={`w-full text-white font-semibold py-3 rounded-xl shadow-lg transition-all ${loading ? 'bg-indigo-500/50 cursor-wait' : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-indigo-500/25 hover:-translate-y-0.5'}`}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm t-text-muted">
            Don't have an account?{" "}
            <Link to={`/register/${role}`} className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;