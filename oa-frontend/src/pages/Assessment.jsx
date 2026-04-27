import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as faceapi from '@vladmandic/face-api';

export default function Assessment() {
  const { applicationId, candidateId } = useParams();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proctoringWarning, setProctoringWarning] = useState(null);
  const [phoneBlocked, setPhoneBlocked] = useState(false);

  const videoRef = useRef(null);
  const warningTimerRef = useRef(null);

  // Initialize Assessment
  useEffect(() => {
    const init = async () => {
      try {
        const qRes = await axios.get("http://localhost:5001/api/assessments/questions");
        setQuestions(qRes.data);
        if (qRes.data.length > 0) setCode(qRes.data[0].templates?.javascript || "");
        const aRes = await axios.post("http://localhost:5001/api/assessments/start", { applicationId, candidateId });
        setAssessment(aRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [applicationId, candidateId]);

  // Proctoring: Webcam & Models
  useEffect(() => {
    let currentStream = null;
    const load = async () => {
      try {
        await tf.ready();
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/');
        window.cocoModel = await cocoSsd.load();
        setModelsLoaded(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        currentStream = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera/Model Error", err);
        logEvent("Webcam Access Denied/Missing");
      }
    };
    load();
    return () => { if (currentStream) currentStream.getTracks().forEach(t => t.stop()); };
  }, []);

  // Proctoring: AI scanning
  useEffect(() => {
    if (!modelsLoaded || !assessment || assessment.status === "Submitted") return;
    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const video = videoRef.current;
        const faces = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        if (faces.length === 0) {
          setProctoringWarning("no_face");
          logEvent("No Face Detected");
          if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
          warningTimerRef.current = setTimeout(() => setProctoringWarning(null), 3000);
        } else if (faces.length > 1) {
          setProctoringWarning("multiple_faces");
          logEvent("Multiple Faces Detected");
          if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
          warningTimerRef.current = setTimeout(() => setProctoringWarning(null), 3000);
        } else {
          if (proctoringWarning === "no_face" || proctoringWarning === "multiple_faces") setProctoringWarning(null);
        }
        if (window.cocoModel) {
          const preds = await window.cocoModel.detect(video);
          if (preds.some(p => p.class === "cell phone")) {
            setPhoneBlocked(true);
            logEvent("Cell Phone Detected!");
            setTimeout(() => setPhoneBlocked(false), 5000);
          }
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [modelsLoaded, assessment]);

  // Tab/Fullscreen/CopyPaste proctoring
  useEffect(() => {
    const onVis = () => { if (document.hidden) logEvent("Tab Switched"); };
    const onFS = () => { document.fullscreenElement ? setIsFullscreen(true) : (setIsFullscreen(false), logEvent("Exited Fullscreen")); };
    const onCP = (e) => { e.preventDefault(); logEvent("Attempted Copy/Paste"); };
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFS);
    document.addEventListener("copy", onCP);
    document.addEventListener("paste", onCP);
    return () => { document.removeEventListener("visibilitychange", onVis); document.removeEventListener("fullscreenchange", onFS); document.removeEventListener("copy", onCP); document.removeEventListener("paste", onCP); };
  }, [assessment]);

  const enterFullscreen = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e)); };

  const logEvent = async (event) => {
    setLogs(prev => [...prev, { event, time: new Date().toLocaleTimeString() }]);
    if (assessment) {
      try { await axios.post("http://localhost:5001/api/assessments/log-proctoring", { assessmentId: assessment._id, event }); }
      catch (_) {}
    }
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

  // Run = visible test cases only
  const runCode = async () => {
    setIsRunning(true); setOutput(null);
    try {
      const res = await axios.post("http://localhost:5001/api/assessments/run-code", {
        questionId: questions[currentQIdx]._id, code, language
      });
      setOutput(res.data);
    } catch (err) {
      setOutput({ error: err.response?.data?.error || "Execution failed" });
    } finally { setIsRunning(false); }
  };

  // Submit = all test cases (visible + hidden), saves to assessment
  const submitCode = async () => {
    setIsSubmitting(true); setOutput(null);
    try {
      const res = await axios.post("http://localhost:5001/api/assessments/submit-code", {
        assessmentId: assessment._id, questionId: questions[currentQIdx]._id, code, language
      });
      setOutput(res.data);
    } catch (err) {
      setOutput({ error: err.response?.data?.error || "Submission failed" });
    } finally { setIsSubmitting(false); }
  };

  const finalizeAssessment = async () => {
    try {
      await axios.post("http://localhost:5001/api/assessments/finish", { assessmentId: assessment._id });
      if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      alert("Assessment submitted successfully!");
      setAssessment({ ...assessment, status: "Submitted" });
    } catch (_) { alert("Failed to submit"); }
  };

  if (!assessment) return <div className="p-20 text-center font-bold text-xl font-sans bg-gray-900 text-white h-screen flex items-center justify-center">Initializing Sandbox Environment...</div>;
  if (assessment.status === "Submitted") return (
    <div className="h-screen bg-gray-900 flex items-center justify-center text-center font-sans">
      <div>
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">Assessment Submitted!</h1>
        <p className="text-gray-500 text-lg">You can now close this tab and return to the dashboard.</p>
      </div>
    </div>
  );

  const currentQ = questions[currentQIdx];
  const visibleTestCases = currentQ ? (currentQ.testCases || []).filter(tc => !tc.isHidden) : [];

  const cameraBorder = proctoringWarning === "no_face" ? "border-red-500 shadow-red-500/30"
    : proctoringWarning === "multiple_faces" ? "border-orange-500 shadow-orange-500/30"
    : "border-gray-700";

  const warningLabel = proctoringWarning === "no_face" ? "⚠ No Face Detected"
    : proctoringWarning === "multiple_faces" ? "⚠ Multiple Faces" : null;

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans relative overflow-hidden">
      {/* Phone Blocker Overlay */}
      {phoneBlocked && (
        <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </div>
            <h2 className="text-3xl font-bold text-red-500 mb-3">Phone Detected!</h2>
            <p className="text-gray-400 text-lg mb-2">Assessment content has been hidden.</p>
            <p className="text-gray-500 text-sm">Remove the phone. Screen will resume automatically.</p>
          </div>
        </div>
      )}

      {/* Fullscreen Enforcer */}
      {!isFullscreen && assessment.status !== "Submitted" && (
        <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl border border-red-500 text-center max-w-lg">
            <svg className="w-16 h-16 text-red-500 animate-pulse mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <h2 className="text-3xl font-extrabold text-white mb-2">Fullscreen Required</h2>
            <p className="text-gray-400 mb-8">This assessment is strictly proctored. You must remain in fullscreen mode.</p>
            <button onClick={enterFullscreen} className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-10 rounded-xl shadow-lg transition-transform hover:scale-105 text-lg w-full">
              {modelsLoaded ? 'Enter Fullscreen & Resume' : 'Loading AI Models...'}
            </button>
          </div>
        </div>
      )}

      {/* ─── LEFT SIDEBAR: Question List ─── */}
      <div className="w-16 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-3 gap-3">
        {/* Question tabs */}
        {questions.map((q, idx) => (
          <button key={q._id} onClick={() => switchQuestion(idx)} className={`w-10 h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${currentQIdx === idx ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
            Q{idx + 1}
          </button>
        ))}

        <div className="mt-auto">
          <button onClick={finalizeAssessment} className="w-10 h-10 bg-red-600 hover:bg-red-500 rounded-lg flex items-center justify-center transition-colors" title="Submit Assessment">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
      </div>

      {/* ─── LEFT PANEL: Problem Description ─── */}
      <div className="w-[38%] flex flex-col border-r border-gray-800 bg-gray-900">
        <div className="p-3 border-b border-gray-800 flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Problem {currentQIdx + 1} of {questions.length}</span>
          {currentQ && <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ml-auto ${currentQ.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : currentQ.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{currentQ?.difficulty}</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {currentQ ? (
            <>
              <h1 className="text-xl font-bold mb-4">{currentQ.title}</h1>
              <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed mb-6">{currentQ.description}</div>

              {visibleTestCases.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Examples</h3>
                  <div className="space-y-3">
                    {visibleTestCases.map((tc, i) => (
                      <div key={i} className="rounded-xl bg-gray-800/60 border border-gray-700 p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Example {i + 1}</p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex gap-2"><span className="font-semibold text-gray-500 min-w-[55px]">Input:</span><code className="font-mono text-gray-300">{tc.input}</code></div>
                          <div className="flex gap-2"><span className="font-semibold text-gray-500 min-w-[55px]">Output:</span><code className="font-mono text-gray-300">{tc.expectedOutput}</code></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl bg-gray-800/40 border border-gray-700 p-3 flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <strong className="text-gray-300">{currentQ.visibleCount || visibleTestCases.length}</strong> visible •{" "}
                <strong className="text-gray-300">{currentQ.hiddenCount || 0}</strong> hidden test cases
              </div>
            </>
          ) : <p className="text-gray-600">Loading question...</p>}
        </div>
      </div>

      {/* ─── RIGHT PANEL: Editor + Output ─── */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex gap-1">
            {["javascript", "python", "cpp", "c", "java"].map(l => (
              <button key={l} onClick={() => handleLanguageChange(l)} className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${language === l ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-gray-500 border border-gray-700 hover:text-gray-300'}`}>
                {{ javascript: "JS", python: "Py", cpp: "C++", c: "C", java: "Java" }[l]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={runCode} disabled={isRunning || isSubmitting} className={`flex items-center gap-1 px-4 py-1.5 rounded text-xs font-bold transition-all border ${isRunning ? 'opacity-50 cursor-wait' : 'border-gray-600 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5'}`}>
              {isRunning ? "Running..." : "▶ Run"}
            </button>
            <button onClick={submitCode} disabled={isRunning || isSubmitting} className={`flex items-center gap-1 px-4 py-1.5 rounded text-xs font-bold transition-all ${isSubmitting ? 'bg-emerald-700/50 text-white cursor-wait' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'}`}>
              {isSubmitting ? "Submitting..." : "Submit Code"}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 min-h-0">
          <Editor height="100%" language={language === "cpp" ? "cpp" : language} theme="vs-dark" value={code} onChange={val => setCode(val)} options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 12 }, scrollBeyondLastLine: false }} />
        </div>

        {/* Output panel */}
        <div className="h-[220px] border-t border-gray-700 bg-gray-800 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Output</span>
            {output && !output.error && (
              <div className="flex items-center gap-2">
                {output.mode === "submit" && <span className="text-[10px] font-bold text-gray-500">{output.passed}/{output.total} passed</span>}
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${output.allPassed ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                  {output.allPassed ? (output.mode === "submit" ? "Accepted ✓" : "All Passed") : `Score: ${output.score || Math.round((output.passed / output.total) * 100)}%`}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!output ? (
              <p className="text-gray-600 text-sm text-center mt-6">Click <strong className="text-gray-400">Run</strong> to test examples, or <strong className="text-gray-400">Submit</strong> to test all cases</p>
            ) : output.error ? (
              <div className="bg-red-900/20 border border-red-800/40 p-3 rounded-lg"><p className="text-red-400 font-mono text-xs whitespace-pre-wrap">{output.error}</p></div>
            ) : (
              <>
                {(output.visibleResults || output.results || []).map((r, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${r.passed ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-gray-500">Test {i + 1}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${r.passed ? 'bg-emerald-800/50 text-emerald-300' : 'bg-red-800/50 text-red-300'}`}>{r.passed ? 'PASS' : 'FAIL'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div><p className="text-gray-600 text-[9px] uppercase font-bold">Input</p><code className="text-gray-300 font-mono">{r.input}</code></div>
                      <div><p className="text-gray-600 text-[9px] uppercase font-bold">Expected</p><code className="text-gray-300 font-mono">{r.expectedOutput || "(Empty)"}</code></div>
                      <div><p className="text-gray-600 text-[9px] uppercase font-bold">Got</p><code className={`font-mono ${r.passed ? "text-gray-300" : "text-red-400"}`}>{r.actualOutput || "(Empty)"}</code></div>
                    </div>
                  </div>
                ))}
                {output.mode === "submit" && output.hiddenSummary && (
                  <div className={`p-3 rounded-lg border ${output.hiddenSummary.passed === output.hiddenSummary.total ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-amber-900/10 border-amber-900/30'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">🔒 Hidden Test Cases</span>
                      <span className={`text-xs font-bold ${output.hiddenSummary.passed === output.hiddenSummary.total ? 'text-emerald-400' : 'text-amber-400'}`}>
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

      {/* Floating Enlarged Camera View */}
      <div className={`absolute bottom-6 right-6 w-40 h-40 rounded-xl overflow-hidden border-2 ${cameraBorder} shadow-2xl z-40 bg-black`}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded text-[9px] font-bold text-white tracking-widest uppercase">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Proctored
        </div>
        {warningLabel && (
          <div className="absolute bottom-0 left-0 w-full bg-red-600 text-white text-xs font-bold text-center py-1 truncate px-1">
            {warningLabel}
          </div>
        )}
      </div>

    </div>
  );
}
