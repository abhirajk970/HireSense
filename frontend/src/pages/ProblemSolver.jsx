import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react";

export default function ProblemSolver() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const candidateId = localStorage.getItem("userId");

  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState("result"); // result | console

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/assessments/questions/${questionId}`);
        setQuestion(res.data);
        setCode(res.data.templates?.javascript || "");
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, [questionId]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (question) setCode(question.templates?.[lang] || "");
  };

  const runCode = async () => {
    setRunning(true);
    setOutput(null);
    setActiveOutputTab("result");
    try {
      const res = await axios.post("http://localhost:5001/api/assessments/practice/run", {
        questionId, code, language
      });
      setOutput(res.data);
    } catch (err) {
      setOutput({ error: err.response?.data?.error || "Execution failed" });
    } finally {
      setRunning(false);
    }
  };

  const submitCode = async () => {
    setSubmitting(true);
    setOutput(null);
    setActiveOutputTab("result");
    try {
      const res = await axios.post("http://localhost:5001/api/assessments/practice/submit", {
        questionId, code, language, candidateId
      });
      setOutput(res.data);
    } catch (err) {
      setOutput({ error: err.response?.data?.error || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const diffBadge = (d) => {
    switch(d) {
      case "Easy": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
      case "Medium": return "bg-amber-500/15 text-amber-400 border-amber-500/25";
      case "Hard": return "bg-red-500/15 text-red-400 border-red-500/25";
      default: return "";
    }
  };

  const editorTheme = (() => {
    try { return document.documentElement.getAttribute("data-theme") === "light" ? "vs" : "vs-dark"; }
    catch { return "vs-dark"; }
  })();

  if (!question) return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const visibleTestCases = (question.testCases || []).filter(tc => !tc.isHidden);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ─── LEFT PANEL: Problem Description ─── */}
      <div className="w-[45%] min-w-[400px] flex flex-col border-r" style={{ borderColor: 'var(--border)' }}>
        {/* Top bar */}
        <div className="flex items-center gap-3 p-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <button onClick={() => navigate("/practice")} className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-indigo-500/10" style={{ borderColor: 'var(--border)' }}>
            <svg className="w-4 h-4 t-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Problem</span>
        </div>

        {/* Description body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title + badges */}
          <div className="mb-5">
            <h1 className="text-xl font-bold t-text mb-3">{question.title}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold border ${diffBadge(question.difficulty)}`}>
                {question.difficulty}
              </span>
              {(question.topicTags || []).map(t => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded-md font-medium border t-text-muted" style={{ borderColor: 'var(--border)' }}>{t}</span>
              ))}
            </div>
            {question.companyTags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {question.companyTags.map(c => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{c}</span>
                ))}
              </div>
            )}
          </div>

          {/* Description text */}
          <div className="text-sm t-text-secondary leading-relaxed whitespace-pre-wrap mb-6">
            {question.description}
          </div>

          {/* Visible test cases */}
          {visibleTestCases.length > 0 && (
            <div>
              <h3 className="text-xs font-bold t-text-muted uppercase tracking-wider mb-3">Examples</h3>
              <div className="space-y-3">
                {visibleTestCases.map((tc, i) => (
                  <div key={i} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <p className="text-[10px] font-bold t-text-muted uppercase mb-2">Example {i + 1}</p>
                    <div className="space-y-1.5">
                      <div className="flex gap-2 text-xs">
                        <span className="font-semibold t-text-muted min-w-[55px]">Input:</span>
                        <code className="font-mono t-text px-2 py-0.5 rounded" style={{ background: 'var(--bg-primary)' }}>{tc.input}</code>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="font-semibold t-text-muted min-w-[55px]">Output:</span>
                        <code className="font-mono t-text px-2 py-0.5 rounded" style={{ background: 'var(--bg-primary)' }}>{tc.expectedOutput}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test case info */}
          <div className="mt-6 rounded-xl border p-3 flex items-center gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-xs t-text-muted">
              <strong className="t-text">{question.visibleCount}</strong> visible test cases •{" "}
              <strong className="t-text">{question.hiddenCount}</strong> hidden test cases •{" "}
              <strong className="t-text">{question.totalCount}</strong> total
            </p>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Editor + Output ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2">
            {["javascript", "python", "cpp", "c", "java"].map(l => (
              <button key={l} onClick={() => handleLanguageChange(l)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${language === l ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25' : 't-text-muted border hover:text-indigo-400'}`} style={language !== l ? { borderColor: 'var(--border)' } : {}}>
                {{ javascript: "JS", python: "Python", cpp: "C++", c: "C", java: "Java" }[l]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={runCode} disabled={running || submitting} className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all ${running ? 'opacity-50 cursor-wait' : 'border hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/25 t-text-muted'}`} style={{ borderColor: 'var(--border)' }}>
              {running ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Running...</> : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg> Run</>}
            </button>
            <button onClick={submitCode} disabled={running || submitting} className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg ${submitting ? 'bg-emerald-500/50 cursor-wait text-white' : 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:shadow-emerald-500/25 hover:-translate-y-0.5'}`}>
              {submitting ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Submit</>}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={language === "cpp" ? "cpp" : language}
            theme={editorTheme}
            value={code}
            onChange={val => setCode(val)}
            options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 }, scrollBeyondLastLine: false }}
          />
        </div>

        {/* Output Panel */}
        <div className="h-[240px] border-t flex flex-col overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-1">
              {["result"].map(tab => (
                <button key={tab} onClick={() => setActiveOutputTab(tab)} className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeOutputTab === tab ? 'text-indigo-400 bg-indigo-500/10' : 't-text-dimmed'}`}>
                  {tab}
                </button>
              ))}
            </div>
            {output && !output.error && (
              <div className="flex items-center gap-2">
                {output.mode === "submit" && (
                  <span className="text-[10px] font-bold t-text-muted">
                    {output.passed}/{output.total} passed
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${output.allPassed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                  {output.allPassed ? (output.mode === "submit" ? "Accepted ✓" : "All Passed") : `Score: ${output.score || Math.round((output.passed/output.total)*100)}%`}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!output ? (
              <div className="h-full flex items-center justify-center">
                <p className="t-text-dimmed text-sm">Click <strong>Run</strong> to test with examples, or <strong>Submit</strong> to test all cases</p>
              </div>
            ) : output.error ? (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                <p className="font-mono text-xs text-red-400 whitespace-pre-wrap">{output.error}</p>
              </div>
            ) : (
              <>
                {/* Visible test case results */}
                {(output.visibleResults || output.results || []).map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${r.passed ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold t-text-muted">Test Case {i+1}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {r.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="t-text-dimmed text-[10px] uppercase font-semibold mb-0.5">Input</p>
                        <code className="font-mono t-text text-[11px]">{r.input}</code>
                      </div>
                      <div>
                        <p className="t-text-dimmed text-[10px] uppercase font-semibold mb-0.5">Expected</p>
                        <code className="font-mono t-text text-[11px]">{r.expectedOutput || "(Empty)"}</code>
                      </div>
                      <div>
                        <p className="t-text-dimmed text-[10px] uppercase font-semibold mb-0.5">Got</p>
                        <code className={`font-mono text-[11px] ${r.passed ? 't-text' : 'text-red-400'}`}>{r.actualOutput || "(Empty)"}</code>
                      </div>
                    </div>
                    {r.error && (
                      <div className="mt-2 p-2 rounded bg-red-500/5 border border-red-500/10">
                        <p className="text-[10px] font-mono text-red-400 whitespace-pre-wrap">{r.error}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Hidden test case summary (submit mode only) */}
                {output.mode === "submit" && output.hiddenSummary && (
                  <div className={`p-4 rounded-xl border ${output.hiddenSummary.passed === output.hiddenSummary.total ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-amber-500/5 border-amber-500/15'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 t-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        <span className="text-xs font-bold t-text-muted">Hidden Test Cases</span>
                      </div>
                      <span className={`text-sm font-bold ${output.hiddenSummary.passed === output.hiddenSummary.total ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {output.hiddenSummary.passed}/{output.hiddenSummary.total} passed
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
