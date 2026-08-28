import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";

export default function DemoAssessment() {
  const { applicationId, candidateId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simulation states
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [proctorLogs, setProctorLogs] = useState([
    { event: "🟢 Session started & proctoring initialized", time: new Date().toLocaleTimeString() },
    { event: "🔒 Fullscreen locked & secured", time: new Date(Date.now() - 30000).toLocaleTimeString() }
  ]);
  const [activeWarning, setActiveWarning] = useState(null);
  const [isPhoneBlocked, setIsPhoneBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);

  const videoRef = useRef(null);

  // Load questions
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/assessments/questions");
        setQuestions(res.data);
        if (res.data.length > 0) {
          setCode(res.data[0].templates?.javascript || "");
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  // Web camera hook
  useEffect(() => {
    let stream = null;
    if (isCameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.warn("Real webcam missing/blocked, using simulated AI avatar feed.", err);
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isCameraOn]);

  const triggerProctoringViolation = async (event, warningKey) => {
    const timeStr = new Date().toLocaleTimeString();
    setProctorLogs(prev => [...prev, { event: `⚠️ Violation: ${event}`, time: timeStr }]);

    // Trigger local overlay
    if (warningKey === "phone") {
      setIsPhoneBlocked(true);
      setTimeout(() => setIsPhoneBlocked(false), 5000);
    } else if (warningKey === "fullscreen") {
      setIsFullscreen(false);
    } else {
      setActiveWarning(warningKey);
      setTimeout(() => setActiveWarning(null), 4000);
    }

    // Call mock API to save log in demo application database
    try {
      await axios.post("http://localhost:5001/api/assessments/log-proctoring", {
        assessmentId: "app-sarah",
        event: `${event} (Simulation)`
      });
    } catch (_) {}
  };

  const handleLanguageChange = (l) => {
    setLanguage(l);
    setCode(questions[currentQIdx]?.templates?.[l] || "");
  };

  const switchQuestion = (idx) => {
    setCurrentQIdx(idx);
    setCode(questions[idx]?.templates?.[language] || "");
    setOutput(null);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const res = await axios.post("http://localhost:5001/api/assessments/run-code", {
        questionId: questions[currentQIdx]?._id,
        code,
        language
      });
      setOutput(res.data);
    } catch (_) {
      setOutput({ error: "Compilation error: Unexpected token" });
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    setIsSubmitting(true);
    setOutput(null);
    try {
      const res = await axios.post("http://localhost:5001/api/assessments/submit-code", {
        questionId: questions[currentQIdx]?._id,
        code,
        language
      });
      setOutput(res.data);
      setProctorLogs(prev => [...prev, { event: `✅ Submited solution for Q${currentQIdx+1} (100% Passed)`, time: new Date().toLocaleTimeString() }]);
    } catch (_) {
      setOutput({ error: "Execution Timeout: Infinite loop detected" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeAssessment = async () => {
    if (window.confirm("Submit your coding assessment and return to Candidate Dashboard?")) {
      try {
        await axios.post("http://localhost:5001/api/assessments/finish");
        alert("Assessment submitted successfully! Returning to Dashboard.");
        navigate("/candidate");
      } catch (_) {}
    }
  };

  const currentQ = questions[currentQIdx];
  const visibleTestCases = currentQ ? (currentQ.testCases || []).filter(tc => !tc.isHidden) : [];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      
      {/* ⚠️ Cell Phone Detection simulation screen lock */}
      {isPhoneBlocked && (
        <div className="absolute inset-0 z-[2000] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fadeIn">
          <div className="text-center max-w-md p-8 border border-red-500/30 rounded-3xl bg-red-950/20 shadow-2xl shadow-red-500/10">
            <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse border border-red-500/35">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </div>
            <h2 className="text-3xl font-black text-red-500 mb-3 tracking-tight">Proctor Shield: Phone Detected!</h2>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">The AI Vision proctoring system flagged a cellular device. Assessment contents have been secured and locked.</p>
            <p className="text-slate-600 text-xs tracking-wider uppercase font-semibold">Resuming automatically in 3 seconds...</p>
          </div>
        </div>
      )}

      {/* ⚠️ Fullscreen Exit warning screen lock */}
      {!isFullscreen && (
        <div className="absolute inset-0 z-[1500] bg-slate-950/95 backdrop-blur-md flex items-center justify-center">
          <div className="bg-slate-900 border border-amber-500/30 p-10 rounded-3xl shadow-2xl max-w-lg text-center shadow-amber-500/5">
            <svg className="w-16 h-16 text-amber-500 animate-pulse mx-auto mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Fullscreen Required</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">You exited the secure browser environment. Visibility loss is automatically logged and sent to company recruiters.</p>
            <button onClick={() => setIsFullscreen(true)} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-amber-500/25 text-white font-extrabold py-3.5 px-10 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 text-sm uppercase tracking-wider">
              Re-engage Fullscreen Lock
            </button>
          </div>
        </div>
      )}

      {/* ─── LEFT: Question Panel ─── */}
      <div className="w-[30%] flex flex-col border-r border-slate-900 bg-slate-950">
        <div className="px-5 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/50">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Question {currentQIdx + 1} of 2</span>
          {currentQ && (
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
              currentQ.difficulty === "Easy" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-amber-500/10 border-amber-500/25 text-amber-400"
            }`}>{currentQ.difficulty}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentQ ? (
            <>
              <h1 className="text-2xl font-black tracking-tight text-white">{currentQ.title}</h1>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{currentQ.description}</div>

              {visibleTestCases.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-[10px] font-black tracking-wider text-slate-500 uppercase mb-3">Input Examples</h4>
                  <div className="space-y-3">
                    {visibleTestCases.map((tc, idx) => (
                      <div key={idx} className="rounded-2xl bg-slate-900/60 border border-slate-900 p-4">
                        <p className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wide mb-2.5">Example {idx + 1}</p>
                        <div className="space-y-1.5 font-mono text-xs text-slate-300">
                          <div><span className="text-slate-600 font-sans mr-2">Input:</span>{tc.input}</div>
                          <div><span className="text-slate-600 font-sans mr-2">Output:</span>{tc.expectedOutput}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-slate-600 text-sm">Loading problem specs...</div>
          )}
        </div>

        {/* Sidebar Questions selector footer */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 flex gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => switchQuestion(i)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentQIdx === i ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-900 text-slate-500 hover:bg-slate-900/80 hover:text-slate-300"
              }`}
            >
              Q{i + 1}
            </button>
          ))}
          <button onClick={finalizeAssessment} className="px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center justify-center text-white transition-colors" title="Finalize Exam">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
      </div>

      {/* ─── CENTER: Monaco Code Workspace ─── */}
      <div className="flex-1 flex flex-col border-r border-slate-900">
        {/* Editor controls navbar */}
        <div className="px-5 py-3 border-b border-slate-900 flex justify-between items-center bg-slate-950/70">
          <div className="flex gap-1.5">
            {["javascript", "python", "cpp"].map(lang => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  language === lang ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-transparent border-slate-900 text-slate-500 hover:text-slate-300"
                }`}
              >
                {lang === "javascript" ? "JavaScript" : lang === "python" ? "Python 3" : "C++"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={runCode} disabled={isRunning || isSubmitting} className="px-4 py-1.5 rounded-xl border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-emerald-400 transition-all font-bold text-xs">
              {isRunning ? "Running..." : "▶ Run code"}
            </button>
            <button onClick={submitCode} disabled={isRunning || isSubmitting} className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 transition-all font-extrabold text-xs">
              {isSubmitting ? "Evaluating..." : "Submit Solution"}
            </button>
          </div>
        </div>

        {/* Real Monaco Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={val => setCode(val)}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', monospace",
              padding: { top: 12 },
              lineHeight: 22,
              scrollBeyondLastLine: false,
              background: "#020617"
            }}
          />
        </div>

        {/* Compiler Results terminal */}
        <div className="h-[240px] border-t border-slate-900 bg-slate-950 flex flex-col">
          <div className="px-5 py-2.5 border-b border-slate-900 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Console logs & Output</span>
            {output && (
              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black border ${
                output.allPassed ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" : "bg-red-950/20 border-red-500/20 text-red-400"
              }`}>{output.allPassed ? "ACCEPTED" : "COMPILE ERROR"}</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
            {!output ? (
              <div className="text-center text-slate-600 font-sans py-16">
                No runs compiled yet. Press <strong className="text-slate-400 font-mono">Run code</strong> to test examples, or <strong className="text-slate-400 font-mono">Submit</strong> for full evaluation.
              </div>
            ) : output.error ? (
              <div className="bg-red-500/15 border border-red-500/20 p-4 rounded-xl text-red-400 whitespace-pre-wrap">{output.error}</div>
            ) : (
              <>
                {(output.visibleResults || []).map((res, i) => (
                  <div key={i} className={`p-3.5 rounded-2xl border ${res.passed ? "bg-emerald-500/5 border-emerald-500/15 text-slate-300" : "bg-red-500/5 border-red-500/15 text-slate-300"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black tracking-wide text-slate-500 uppercase">Test Case {i + 1}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${res.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{res.passed ? "PASS" : "FAIL"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[11px] font-mono">
                      <div><p className="text-slate-600 font-sans text-[9px] font-bold uppercase tracking-wider mb-0.5">Input</p>{res.input}</div>
                      <div><p className="text-slate-600 font-sans text-[9px] font-bold uppercase tracking-wider mb-0.5">Expected</p>{res.expectedOutput}</div>
                      <div><p className="text-slate-600 font-sans text-[9px] font-bold uppercase tracking-wider mb-0.5">Output</p>{res.actualOutput}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Recruiter Proctor Simulator Cockpit ─── */}
      <div className="w-[28%] bg-slate-900 flex flex-col border-l border-slate-900">
        <div className="px-5 py-4 border-b border-slate-900 bg-slate-900/50 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-xs text-white">⚙️ Recruiter Simulator Controls</h3>
            <p className="text-[9px] text-cyan-400 font-black tracking-widest uppercase mt-0.5">Vision Proctor Cockpit</p>
          </div>
        </div>

        {/* Live Proctoring Monitor Grid */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Webcam Simulator Box */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
            {isCameraOn ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6 text-slate-600 text-xs">
                <svg className="w-8 h-8 mx-auto mb-2 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                Real Webcam Disabled
              </div>
            )}

            {/* Video overlay badges */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-white tracking-widest uppercase flex items-center gap-1.5 border border-white/[0.04]">
              <div className={`w-2 h-2 rounded-full ${activeWarning ? "bg-red-500 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
              {activeWarning ? "Proctor Flagged" : "AI Proctor Active"}
            </div>

            {/* Simulated overlay alerts */}
            {activeWarning === "no_face" && (
              <div className="absolute inset-0 bg-red-950/70 backdrop-blur-xs flex items-center justify-center text-center p-3 animate-fadeIn">
                <div className="text-red-400 text-xs font-black uppercase tracking-wider">
                  ⚠️ Alert: No Face Detected
                </div>
              </div>
            )}
            {activeWarning === "multiple_faces" && (
              <div className="absolute inset-0 bg-red-950/70 backdrop-blur-xs flex items-center justify-center text-center p-3 animate-fadeIn">
                <div className="text-red-400 text-xs font-black uppercase tracking-wider">
                  ⚠️ Alert: Multiple Faces Detected
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">Proctor Camera Sensor</span>
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                isCameraOn ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {isCameraOn ? "Camera: ON" : "Camera: OFF"}
            </button>
          </div>

          {/* Trigger alerts container */}
          <div className="space-y-2 border-t border-slate-800/60 pt-4.5">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block mb-1">Trigger Mock Violations</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerProctoringViolation("No Face Detected", "no_face")}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-950/80 rounded-xl text-left border border-slate-800 hover:border-red-500/30 text-slate-300 transition-all font-semibold text-xs flex flex-col gap-0.5 group"
              >
                <span className="group-hover:text-red-400 transition-colors">👤 No Face</span>
                <span className="text-[9px] text-slate-600 font-normal">Candidate walks away</span>
              </button>

              <button
                onClick={() => triggerProctoringViolation("Multiple Faces Detected", "multiple_faces")}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-950/80 rounded-xl text-left border border-slate-800 hover:border-red-500/30 text-slate-300 transition-all font-semibold text-xs flex flex-col gap-0.5 group"
              >
                <span className="group-hover:text-red-400 transition-colors">👥 Multi-Face</span>
                <span className="text-[9px] text-slate-600 font-normal">Another person enters</span>
              </button>

              <button
                onClick={() => triggerProctoringViolation("Cell Phone Detected", "phone")}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-950/80 rounded-xl text-left border border-slate-800 hover:border-red-500/30 text-slate-300 transition-all font-semibold text-xs flex flex-col gap-0.5 group"
              >
                <span className="group-hover:text-red-400 transition-colors">📱 Cell Phone</span>
                <span className="text-[9px] text-slate-600 font-normal">TensorFlow object detection</span>
              </button>

              <button
                onClick={() => triggerProctoringViolation("Tab Switched (Visibility Loss)", "fullscreen")}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-950/80 rounded-xl text-left border border-slate-800 hover:border-red-500/30 text-slate-300 transition-all font-semibold text-xs flex flex-col gap-0.5 group"
              >
                <span className="group-hover:text-red-400 transition-colors">💻 Tab Switch</span>
                <span className="text-[9px] text-slate-600 font-normal">De-fullscreen the workspace</span>
              </button>
            </div>
            
            <button
              onClick={() => triggerProctoringViolation("Clipboard Copy/Paste Violation", "copy")}
              className="w-full py-2 bg-slate-950 hover:bg-slate-950/80 border border-slate-800 hover:border-red-500/30 rounded-xl font-semibold text-xs text-slate-300 hover:text-white transition-colors"
            >
              📋 Try Clipboard Copy/Paste Alert
            </button>
          </div>

          {/* Real-time alert logs */}
          <div className="border-t border-slate-800/60 pt-4.5 space-y-2 flex flex-col h-[220px]">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Live Proctoring Log</span>
            
            <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800/50 rounded-xl p-3 space-y-2.5 font-mono text-[10px] text-slate-400">
              {proctorLogs.map((log, i) => (
                <div key={i} className="flex justify-between items-start leading-relaxed border-b border-slate-900/50 pb-1.5">
                  <span className={`mr-2 flex-1 ${
                    log.event.includes("Violation") ? "text-red-400 font-semibold" : 
                    log.event.includes("Passed") ? "text-emerald-400 font-semibold" : ""
                  }`}>{log.event}</span>
                  <span className="text-slate-600 font-normal whitespace-nowrap">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
