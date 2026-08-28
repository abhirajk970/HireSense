import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";

export default function DemoAIInterview() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Chat conversation logs
  const [messages, setMessages] = useState([
    { role: "ai", text: "🎙️ Welcome to the HireSense AI Technical Assessment. I am your local LLaMA-3 voice prompter. Let's begin by looking at the coding challenge in your Notebook panel. Can you explain your initial intuition for solving it?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // DSA / Notebook details
  const [interviewState, setInterviewState] = useState("INTUITION");
  const [code, setCode] = useState("function twoSum(nums, target) {\n    // Explain approach in chat, then write code\n    \n}");
  const [dsaTitle, setDsaTitle] = useState("Two Sum (DSA Question)");
  const [dsaDesc, setDsaDesc] = useState("Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.");

  // Scoring parameters
  const [hintLevel, setHintLevel] = useState(0);
  const [hintPenalty, setHintPenalty] = useState(0);
  const [score, setScore] = useState(null);

  // LLaMA "Under the hood" thinking log
  const [llamaThinking, setLlamaThinking] = useState([
    { event: "🧠 LLaMA Initialized: LLaMA-3-8B-Instruct via local Ollama core", time: "Just now" },
    { event: "🎯 Stage set: INTUITION. Waiting for algorithm explanation.", time: "Just now" }
  ]);

  const chatEndRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const logLlama = (event) => {
    setLlamaThinking(prev => [...prev, { event, time: new Date().toLocaleTimeString() }]);
  };

  // Speaks out LLaMA replies using browser voice
  const speakText = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    // Clean emojis & formatting for smooth reading
    const clean = text.replace(/[*#📝⚙️💻💡✅❌⚠️🎉📊🗣🏁📋💭❓🔄🎙️]/g, "");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const handleSendChat = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: "candidate", text }]);
    setInputText("");
    setIsThinking(true);
    logLlama(`📥 Candidate sent chat: "${text}"`);

    setTimeout(() => {
      setIsThinking(false);
      let reply = "";
      if (interviewState === "INTUITION") {
        reply = "💡 Excellent intuition! Your hash map approach gives an optimal O(N) time complexity and O(N) space complexity. Let's write the complete solution inside your Monaco editor now. Click 'Submit Code' once finished!";
        setInterviewState("CODE_WRITING");
        logLlama("🎯 Stage transitioned: CODE_WRITING. Unlocking Monaco algorithm panel.");
      } else {
        reply = "⚙️ I see what you mean. We can refine the index complement calculations. Let's double check your syntax and verify if it compiles correctly.";
      }
      setMessages(prev => [...prev, { role: "ai", text: reply }]);
      speakText(reply);
    }, 1500);
  };

  const requestHint = async () => {
    if (hintLevel >= 4) return;
    setIsThinking(true);
    logLlama("💡 Hint requested by candidate. Fetching hint penalties.");

    try {
      const res = await axios.post("http://localhost:5200/api/dsa/request-hint");
      const { message, hintLevel: lvl, penalty } = res.data;

      setHintLevel(lvl);
      setHintPenalty(penalty);
      setIsThinking(false);
      setMessages(prev => [...prev, { role: "ai", text: `💡 Hint ${lvl}/4: ${message}` }]);
      speakText(message);
      logLlama(`🧠 LLaMA Thinking: Provided Hint Level ${lvl}. Deduction of -${penalty}% applied.`);
    } catch (_) {
      setIsThinking(false);
    }
  };

  // Autoplay Tour Macro
  const startAutoplay = () => {
    logLlama("🚀 Autoplay simulation sequence started!");

    // Step 1: Candidate types intuition
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "candidate", text: "I will use a hash map to keep track of indices of complements. For each number, I check if target - nums[i] is already in the map. If it is, I return the indices. This runs in O(N)." }]);
      logLlama("📥 Candidate: Explained optimal hash map algorithm.");
      setIsThinking(true);
    }, 2000);

    // Step 2: LLaMA replies to write code
    setTimeout(() => {
      setIsThinking(false);
      const reply = "💡 Fantastic analysis! O(N) is indeed the optimal time complexity. Go ahead and write the implementation in your code editor.";
      setMessages(prev => [...prev, { role: "ai", text: reply }]);
      speakText(reply);
      setInterviewState("CODE_WRITING");
      logLlama("🎯 Stage transitioned: CODE_WRITING.");
    }, 4500);

    // Step 3: Populate code editor automatically
    setTimeout(() => {
      logLlama("💻 Monaco Editor: Simulated candidate typing code.");
      setCode(`function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}`);
    }, 7000);

    // Step 4: Submit code & evaluate
    setTimeout(() => {
      logLlama("🧪 Running compilation test pipelines...");
      setMessages(prev => [...prev, { role: "candidate", text: "I have written the solution, let's run the tests." }]);
    }, 10000);

    // Step 5: LLaMA validates and completes interview
    setTimeout(() => {
      setScore(95);
      const reply = "🎉 Outstanding! Your code passed 100% of test cases. You maintained excellent O(N) execution speeds. We have finalized your evaluations and scored you at 95%. I will now submit your technical dossier to the recruiter. Great job!";
      setMessages(prev => [...prev, { role: "ai", text: reply }]);
      speakText(reply);
      setInterviewState("COMPLETED");
      logLlama("🏁 LLaMA completed scoring: 95/100. Evaluation saved.");

      // Update local storage DB so employer instantly sees completed interview
      const apps = JSON.parse(localStorage.getItem("demo_applications") || "[]");
      const updatedApps = apps.map(a => a._id === "app-sarah" ? { ...a, status: "Interview", aiScore: 95 } : a);
      localStorage.setItem("demo_applications", JSON.stringify(updatedApps));

      const ints = JSON.parse(localStorage.getItem("demo_interviews") || "[]");
      const updatedInts = ints.map(i => i._id === "int-sarah-ai" ? { ...i, status: "Completed" } : i);
      localStorage.setItem("demo_interviews", JSON.stringify(updatedInts));
    }, 13000);
  };

  const finalizeEarly = () => {
    if (window.confirm("End interview early?")) {
      const apps = JSON.parse(localStorage.getItem("demo_applications") || "[]");
      const updatedApps = apps.map(a => a._id === "app-sarah" ? { ...a, status: "Interview", aiScore: 82 } : a);
      localStorage.setItem("demo_applications", JSON.stringify(updatedApps));
      navigate("/candidate");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">

      {/* Top navbar info */}
      <div className="h-10 bg-slate-950 border-b border-white/[0.06] flex items-center justify-between px-5 flex-shrink-0">
        <span className="text-[10px] font-black tracking-widest uppercase">
          {isThinking ? (
            <span className="flex items-center gap-1.5 text-violet-400">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              LLaMA-3 is compiling approach...
            </span>
          ) : (
            <span className="text-indigo-400">🟢 Interview Stage: {interviewState}</span>
          )}
        </span>
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
          {hintLevel > 0 && <span className="text-amber-400 font-bold">💡 {hintLevel}/4 hints utilized · -{hintPenalty}% penalty</span>}
          <span>Room: {roomId || "room-sarah-llama"}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">

        {/* ─── LEFT: Chat Feed Panel ─── */}
        <div className="w-[28%] flex flex-col border-r border-slate-900 bg-slate-950">
          <div className="px-5 py-4 border-b border-slate-900 bg-slate-950/60 flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">Interactive Voice Assistant</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === "candidate" ? "justify-end" : "justify-start"}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed border ${m.role === "candidate"
                    ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-lg shadow-indigo-500/10"
                    : "bg-slate-900 border-slate-800 text-slate-300 rounded-tl-none"
                  }`}>
                  <p className="font-extrabold text-[9px] text-indigo-300 uppercase tracking-widest mb-1">{m.role === "candidate" ? "You" : "LLaMA Voice"}</p>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat user text inputs */}
          <div className="p-4 border-t border-slate-900 bg-slate-950">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                disabled={interviewState === "COMPLETED"}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendChat(inputText)}
                placeholder="Type explanation / approach to AI..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none"
              />
              <button
                onClick={() => handleSendChat(inputText)}
                disabled={interviewState === "COMPLETED"}
                className="px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs text-white shadow-lg shadow-indigo-500/15"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* ─── CENTER: Notebook DSA Panel ─── */}
        <div className="flex-1 flex flex-col border-r border-slate-900 bg-slate-950">
          <div className="px-5 py-4 border-b border-slate-900 bg-slate-950/60">
            <h2 className="font-black text-sm text-white">{dsaTitle}</h2>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Description card */}
            <div className="p-6 border-b border-slate-900 bg-slate-950/30">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Problem Constraints & Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{dsaDesc}</p>
            </div>

            {/* Monaco Sandbox panel */}
            <div className="flex-1 min-h-[300px]">
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={val => setCode(val)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13.5,
                  fontFamily: "'Fira Code', monospace",
                  padding: { top: 12 },
                  lineHeight: 22,
                  scrollBeyondLastLine: false
                }}
              />
            </div>
          </div>

          {/* Submission and score drawer */}
          <div className="px-5 py-3 border-t border-slate-900 bg-slate-950 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Auto-testing pipeline engages on submit.</span>
            <div className="flex gap-2">
              <button onClick={finalizeEarly} className="px-4 py-2 border border-slate-900 rounded-xl font-bold text-xs text-slate-400 hover:text-slate-200">
                End Early
              </button>
              <button
                onClick={() => {
                  setMessages(prev => [...prev, { role: "candidate", text: "I have written the implementation. Submit and score it." }]);
                  setIsThinking(true);
                  setTimeout(() => {
                    setIsThinking(false);
                    setScore(90);
                    setInterviewState("COMPLETED");
                    const reply = "🎉 Compilation passed! All test cases succeeded. AI technical grading completes with an excellent 90% score!";
                    setMessages(prev => [...prev, { role: "ai", text: reply }]);
                    speakText(reply);
                  }, 1500);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-extrabold text-xs text-white"
              >
                Submit Code Solution
              </button>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: LLaMA Model Core Simulator ─── */}
        <div className="w-[28%] bg-slate-900 flex flex-col border-l border-slate-900">
          <div className="px-5 py-4 border-b border-slate-900 bg-slate-900/50 flex justify-between items-center bg-slate-900/80">
            <div>
              <h3 className="font-extrabold text-xs text-white">⚙️ AI Model Controller</h3>
              <p className="text-[9px] text-cyan-400 font-black tracking-widest uppercase mt-0.5">Ollama Core Simulation</p>
            </div>
            <button
              onClick={startAutoplay}
              className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-extrabold text-[10px] rounded-lg shadow-lg hover:shadow-cyan-500/25 tracking-wider uppercase transition-all"
            >
              🚀 Autoplay 45s Tour
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-6">

            {/* AIAvatar Animation simulator */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-24 h-24 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shadow-xl">
                <div className={`absolute inset-1 rounded-full border-2 border-indigo-500/30 ${isAiSpeaking ? "animate-pulse" : ""}`} />
                <div className={`absolute inset-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl transition-all duration-300 flex items-center justify-center ${isAiSpeaking ? "scale-105" : "scale-95"
                  }`}>
                  <span className="text-xl">🤖</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white">Local LLaMA 3 Core</p>
                <p className="text-[10px] text-slate-500">{isAiSpeaking ? "🎙️ Speaking..." : isThinking ? "🧠 Thinking..." : "🟢 Listening for input"}</p>
              </div>
            </div>

            {/* Hint & End triggers */}
            <div className="space-y-2 border-t border-slate-800/60 pt-5">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">AI Prompter Interactions</span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={requestHint}
                  disabled={hintLevel >= 4}
                  className="py-2 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/30 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  💡 Hint ({hintLevel}/4)
                </button>

                <button
                  onClick={() => {
                    const text = "Hint 1: Map complements to indices.";
                    setMessages(prev => [...prev, { role: "ai", text: `💡 Simulated Hint: ${text}` }]);
                    speakText(text);
                  }}
                  className="py-2 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/30 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  Simulate Hint
                </button>
              </div>
            </div>

            {/* Behind the scenes thinking log */}
            <div className="border-t border-slate-800/60 pt-5 flex flex-col h-[260px] space-y-2">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">LLaMA Model Thinking Stream</span>

              <div className="flex-1 bg-slate-950 border border-slate-800/60 rounded-2xl p-4 font-mono text-[10px] text-slate-400 overflow-y-auto space-y-3 leading-relaxed">
                {llamaThinking.map((log, i) => (
                  <div key={i} className="flex justify-between items-start border-b border-slate-900 pb-2">
                    <span className={`flex-1 leading-normal ${log.event.includes("Autoplay") ? "text-cyan-400 font-semibold" :
                        log.event.includes("penalties") || log.event.includes("Deduction") ? "text-amber-400" :
                          log.event.includes("completed") ? "text-emerald-400 font-semibold" : ""
                      }`}>{log.event}</span>
                    <span className="text-slate-600 ml-2 whitespace-nowrap">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
