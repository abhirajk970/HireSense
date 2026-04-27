import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

export default function DSAPractice() {
  const [questions, setQuestions] = useState([]);
  const [solvedIds, setSolvedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // All | Solved | Unsolved
  const navigate = useNavigate();
  const candidateId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          axios.get("http://localhost:5001/api/assessments/questions/all"),
          candidateId ? axios.get(`http://localhost:5001/api/assessments/practice/solved/${candidateId}`) : Promise.resolve({ data: [] })
        ]);
        setQuestions(qRes.data);
        setSolvedIds(sRes.data);
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [candidateId]);

  // Derive unique topic and company tags
  const allTopics = useMemo(() => {
    const tags = new Set();
    questions.forEach(q => q.topicTags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [questions]);

  const allCompanies = useMemo(() => {
    const tags = new Set();
    questions.forEach(q => q.companyTags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [questions]);

  // Filter logic
  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (diffFilter !== "All" && q.difficulty !== diffFilter) return false;
      if (topicFilter !== "All" && !(q.topicTags || []).includes(topicFilter)) return false;
      if (companyFilter !== "All" && !(q.companyTags || []).includes(companyFilter)) return false;
      const isSolved = solvedIds.includes(q._id);
      if (statusFilter === "Solved" && !isSolved) return false;
      if (statusFilter === "Unsolved" && isSolved) return false;
      return true;
    });
  }, [questions, search, diffFilter, topicFilter, companyFilter, statusFilter, solvedIds]);

  const diffBadge = (d) => {
    switch(d) {
      case "Easy": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Medium": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Hard": return "bg-red-500/10 text-red-400 border border-red-500/20";
      default: return "";
    }
  };

  const selectStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' };

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold t-text flex items-center gap-3">
            <span className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            </span>
            DSA Practice Arena
          </h1>
          <p className="text-sm t-text-muted mt-1 ml-12">Master algorithms and data structures with curated problems</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: questions.length, color: "indigo" },
            { label: "Solved", value: solvedIds.length, color: "emerald" },
            { label: "Easy", value: questions.filter(q=>q.difficulty==="Easy").length, color: "green" },
            { label: "Medium", value: questions.filter(q=>q.difficulty==="Medium").length, color: "amber" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
              <p className="text-xs font-semibold t-text-muted uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl border p-4 mb-6 flex items-center gap-3 flex-wrap" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="relative flex-1 min-w-[200px]">
            <svg className="w-4 h-4 absolute left-3 top-[11px] t-text-dimmed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input className="w-full border pl-9 pr-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" style={selectStyle} placeholder="Search problems..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <select className="border rounded-lg px-3 py-2 text-sm font-medium outline-none" style={selectStyle} value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
            <option value="All">All Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select className="border rounded-lg px-3 py-2 text-sm font-medium outline-none" style={selectStyle} value={topicFilter} onChange={e => setTopicFilter(e.target.value)}>
            <option value="All">All Topics</option>
            {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2 text-sm font-medium outline-none" style={selectStyle} value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
            <option value="All">All Companies</option>
            {allCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2 text-sm font-medium outline-none" style={selectStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Solved">Solved</option>
            <option value="Unsolved">Unsolved</option>
          </select>
        </div>

        {/* Problem Table */}
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="p-3 pl-5 text-[10px] font-bold uppercase tracking-wider t-text-muted w-12">Status</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider t-text-muted">Title</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider t-text-muted w-24">Difficulty</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider t-text-muted">Topics</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider t-text-muted">Companies</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider t-text-muted w-24 text-right pr-5">Acceptance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-12 text-center t-text-dimmed">No problems match your filters.</td></tr>
              ) : filtered.map((q, idx) => {
                const solved = solvedIds.includes(q._id);
                return (
                  <tr key={q._id} onClick={() => navigate(`/practice/${q._id}`)} className="border-b cursor-pointer transition-colors hover:bg-indigo-500/5" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-3 pl-5">
                      {solved ? (
                        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-medium t-text hover:text-indigo-400 transition-colors">{idx + 1}. {q.title}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${diffBadge(q.difficulty)}`}>{q.difficulty}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(q.topicTags || []).slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium border t-text-muted" style={{ borderColor: 'var(--border)' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(q.companyTags || []).slice(0, 2).map(c => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{c}</span>
                        ))}
                        {(q.companyTags || []).length > 2 && <span className="text-[10px] t-text-dimmed">+{q.companyTags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="p-3 pr-5 text-right">
                      <span className={`text-sm font-semibold ${q.acceptance >= 60 ? 'text-emerald-400' : q.acceptance >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {q.acceptance}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs t-text-dimmed text-center mt-4">Showing {filtered.length} of {questions.length} problems</p>
      </div>
    </DashboardLayout>
  );
}
