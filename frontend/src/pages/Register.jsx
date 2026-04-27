import { useState } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";

function Register() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isCandidate = role === "candidate";

  const [form, setForm] = useState({
    name: "", email: "", password: "",
    role: role || "candidate",
    companyName: "", description: ""
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await axios.post("http://localhost:5000/api/auth/register", form);
        navigate(`/login/${role}`);
    } catch(err) {
        setError(err.response?.data?.msg || "Registration failed");
        setLoading(false);
    }
  };

  const inputStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-[-15%] left-[-8%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-15%] right-[-8%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">HireSense</span>
        </Link>

        <div className="rounded-2xl p-8 backdrop-blur-xl shadow-2xl border" style={{ background: 'var(--bg-card-solid)', borderColor: 'var(--border)' }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">New Account</span>
            </div>
            <h1 className="text-2xl font-bold mb-1 t-text">
              {isCandidate ? "Create Candidate Account" : "Register Your Company"}
            </h1>
            <p className="text-sm t-text-muted">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="t-danger border p-3 rounded-xl mb-6 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 t-text-muted">Full Name</label>
              <input required placeholder="John Doe" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition" style={inputStyle} onChange={(e) => setForm({...form, name: e.target.value})} />
            </div>

            {!isCandidate && (
               <div>
                  <label className="block text-sm font-medium mb-1.5 t-text-muted">Company Name</label>
                  <input required placeholder="Acme Corp" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-violet-500/50 outline-none transition" style={inputStyle} onChange={(e) => setForm({...form, companyName: e.target.value})} />
               </div>
            )}

            <div>
               <label className="block text-sm font-medium mb-1.5 t-text-muted">Email Address</label>
               <input required type="email" placeholder="you@example.com" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition" style={inputStyle} onChange={(e) => setForm({...form, email: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 t-text-muted">Password</label>
              <input required type="password" placeholder="••••••••" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition" style={inputStyle} onChange={(e) => setForm({...form, password: e.target.value})} />
            </div>

             {!isCandidate && (
               <div>
                  <label className="block text-sm font-medium mb-1.5 t-text-muted">Company Description</label>
                  <textarea rows="3" placeholder="What does your company do?" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-violet-500/50 outline-none transition resize-none" style={inputStyle} onChange={(e) => setForm({...form, description: e.target.value})} />
               </div>
            )}

            <button type="submit" disabled={loading} className={`w-full mt-2 text-white font-semibold py-3 rounded-xl shadow-lg transition-all ${loading ? 'bg-indigo-500/50 cursor-wait' : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-indigo-500/25 hover:-translate-y-0.5'}`}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm t-text-muted">
            Already have an account?{" "}
            <Link to={`/login/${role}`} className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;