import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = "http://localhost:5300/api/practice-session";

export default function PracticeRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [activeSession, setActiveSession] = useState(null);
  const [inputText, setInputText] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  const synthRef = useRef(window.speechSynthesis);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  // Load existing session or reset
  useEffect(() => {
    if (sessionId) {
      // For showcase simplicity, if loaded with ID we can read from memory or start fresh
    }
  }, [sessionId]);

  // Speech Recognition Init
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setInputText(prev => prev ? prev + " " + text : text);
        setIsListening(false);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  // Voice synthesis speaker
  const speakText = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const clean = text.replace(/[*#📝⚙️💻🗒️💡✅❌⚠️🎉📊🗣🏁📋💭❓🔄🎙️]/g, "");
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 1.0;
    utt.pitch = 1.0;

    utt.onstart = () => setIsAiSpeaking(true);
    utt.onend = () => setIsAiSpeaking(false);
    utt.onerror = () => setIsAiSpeaking(false);

    synthRef.current.speak(utt);
  };

  const startSession = async (discipline) => {
    setSelectedDiscipline(discipline);
    setIsThinking(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/start`, {
        candidateId: "demo-practice-user",
        discipline
      });
      setActiveSession(res.data);
      speakText(res.data.messages[0].text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendChat = async (text) => {
    if (!text.trim() || isThinking) return;
    setIsThinking(true);

    // optimistically update candidate message
    const tempMessages = [...activeSession.messages, { role: "candidate", text }];
    setActiveSession(prev => ({ ...prev, messages: tempMessages }));
    setInputText("");

    try {
      const res = await axios.post(`${BACKEND_URL}/respond`, {
        sessionId: activeSession._id,
        text
      });
      setActiveSession(res.data);
      const lastMsg = res.data.messages[res.data.messages.length - 1];
      speakText(lastMsg.text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const triggerEvaluation = async () => {
    setIsThinking(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/evaluate`, {
        sessionId: activeSession._id
      });
      setActiveSession(res.data);
      setEvaluation(res.data.scores);
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  const tracks = [
    { name: "Frontend Engineering", icon: "🖥️", desc: "React, Webpack/Vite performance, JS engines, styling architecture.", bg: "from-cyan-500/10 to-blue-600/5", border: "border-cyan-500/20", hover: "hover:border-cyan-400/40" },
    { name: "Backend Engineering", icon: "⚙️", desc: "API design patterns, Redis database caches, docker scaling, SQL indices.", bg: "from-indigo-500/10 to-violet-600/5", border: "border-indigo-500/20", hover: "hover:border-indigo-400/40" },
    { name: "System Design", icon: "🌐", desc: "Distributed microservices, horizontal scaling, cloud architecture setups.", bg: "from-violet-500/10 to-fuchsia-600/5", border: "border-violet-500/20", hover: "hover:border-violet-400/40" },
    { name: "Behavioral Interview", icon: "💭", desc: "Curated STAR templates, conflict resolving, prioritization, project failures.", bg: "from-emerald-500/10 to-teal-600/5", border: "border-emerald-500/20", hover: "hover:border-emerald-400/40" }
  ];

  // Render Selection Dashboard
  if (!selectedDiscipline) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px]" />

        <div className="text-center max-w-2xl mx-auto mb-12 relative z-10 animate-slideUp">
          <span className="text-[10px] tracking-widest font-black text-indigo-400 uppercase bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">AI Practice Arena</span>
          <h1 className="text-4xl md:text-5xl font-black mt-5 mb-4 text-white leading-tight">Master Your Next Interview</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Select a practice discipline below. Our autonomous AI Coach (LLaMA-3) will conduct a highly realistic technical or behavioral mock interview with voice synthesis and speech inputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl w-full relative z-10">
          {tracks.map((t, idx) => (
            <div
              key={idx}
              onClick={() => startSession(t.name.split(" ")[0])}
              className={`p-6 rounded-3xl border bg-gradient-to-br cursor-pointer transition-all duration-300 hover:-translate-y-1 flex gap-5 items-start ${t.bg} ${t.border} ${t.hover}`}
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border border-white/[0.04]">
                {t.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-sm text-white">{t.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Completed Evaluation Scorecard
  if (evaluation) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px]" />
        
        <div className="max-w-xl w-full border border-emerald-500/20 backdrop-blur-xl bg-slate-900/60 p-8 rounded-3xl shadow-2xl relative z-10 animate-slideUp text-center">
          <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/25 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-emerald-500/10">
            📊
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Practice Session Evaluated!</h2>
          <p className="text-slate-400 text-xs tracking-wider uppercase font-semibold mb-6">AI Evaluation report card</p>

          {/* Glowing score badge */}
          <div className="bg-slate-950 border border-white/[0.06] rounded-2xl p-6 mb-6 max-w-xs mx-auto">
            <p className="text-[10px] tracking-widest font-black text-slate-500 uppercase mb-2">Technical EQ Score</p>
            <div className="flex justify-center items-end text-white">
              <span className="text-6xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{evaluation.score}</span>
              <span className="text-2xl font-bold text-slate-500 mb-1 ml-1">%</span>
            </div>
          </div>

          <div className="text-left space-y-5">
            <div>
              <h4 className="text-[10px] font-black text-slate-500 tracking-wider uppercase mb-2">Strengths & Feedback</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl">{evaluation.feedback}</p>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-500 tracking-wider uppercase mb-2">Key Areas of Improvement</h4>
              <ul className="space-y-2">
                {evaluation.improvements?.map((imp, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-400">
                    <span className="text-emerald-400 flex-shrink-0">✓</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedDiscipline(null);
              setEvaluation(null);
              setActiveSession(null);
            }}
            className="w-full mt-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:shadow-emerald-500/20 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all"
          >
            Start New Practice Round
          </button>
        </div>
      </div>
    );
  }

  // Render Active Chat Interview Room
  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <div className="h-12 bg-slate-950 border-b border-white/[0.06] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="font-extrabold text-xs text-white">HireSense AI Coach</h3>
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{selectedDiscipline} Arena</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={triggerEvaluation}
            disabled={isThinking || (activeSession?.messages || []).filter(m => m.role === "candidate").length < 1}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors disabled:opacity-50"
          >
            Finalize Evaluation
          </button>
          <button
            onClick={() => {
              setSelectedDiscipline(null);
              setActiveSession(null);
            }}
            className="text-slate-500 hover:text-slate-300 text-xs font-semibold"
          >
            Quit Practice
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT: Interviewer AI Dialogue Feed */}
        <div className="flex-1 flex flex-col bg-slate-950">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeSession?.messages?.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === "candidate" ? "justify-end" : "justify-start"}`}>
                <div className={`p-4.5 rounded-3xl max-w-[70%] text-xs leading-relaxed border ${
                  m.role === "candidate"
                    ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-lg shadow-indigo-500/10 animate-slideUp"
                    : "bg-slate-900 border-slate-800 text-slate-300 rounded-tl-none animate-fadeIn"
                }`}>
                  <p className="font-extrabold text-[9px] text-indigo-300 uppercase tracking-widest mb-1.5">
                    {m.role === "candidate" ? "You" : "AI Coach"}
                  </p>
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-slate-500 text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  AI Coach is evaluating details...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* User Input & Audio Dictation Toolbar */}
          <div className="p-5 border-t border-slate-900/60 bg-slate-950">
            <div className="max-w-4xl mx-auto flex gap-3 items-center">
              {/* Audio Dictation button */}
              <button
                onClick={toggleListening}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg border transition-all ${
                  isListening 
                    ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse shadow-lg shadow-red-500/5" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
                title={isListening ? "Listening verbally... Click to stop" : "Start Voice Dictation"}
              >
                🎤
              </button>

              <input
                type="text"
                value={inputText}
                disabled={isThinking}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendChat(inputText)}
                placeholder={isListening ? "Dictating your answer verbally..." : "Type response to Coach..."}
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none"
              />

              <button
                onClick={() => handleSendChat(inputText)}
                disabled={isThinking || !inputText.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-xs text-white shadow-lg shadow-indigo-500/15"
              >
                Submit Answer
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Avatar State Monitor panel */}
        <div className="w-64 border-l border-slate-900/60 bg-slate-900 flex flex-col items-center p-5 gap-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-24 h-24 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-xl">
              <div className={`absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ${
                isAiSpeaking ? "animate-pulse scale-105" : "scale-95"
              }`} />
              <span className="text-xl relative z-10">🤖</span>
            </div>
            <div className="text-center space-y-1">
              <p className="font-extrabold text-xs text-white">AI Coach Prompter</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
                {isAiSpeaking ? "🔊 Speaking..." : isListening ? "🎤 Listening..." : "🟢 Connected"}
              </p>
            </div>
          </div>

          <div className="w-full mt-auto space-y-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Instructions</p>
            <div className="p-3 bg-slate-950 border border-slate-800/40 rounded-xl text-[10px] text-slate-400 leading-relaxed space-y-2">
              <p>🗣 <strong>Verbal mode:</strong> Tap the mic to articulate answers verbally using local voice speech dictation.</p>
              <p>⏱ <strong>Feedback:</strong> Progress through queries, then tap <strong>Finalize Evaluation</strong> for a detailed scorecard.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
