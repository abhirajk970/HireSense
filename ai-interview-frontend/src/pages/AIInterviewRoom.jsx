import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import AIChatPanel from '../components/AIChatPanel';
import AIAvatar from '../components/AIAvatar';
import NotebookPanel from '../components/NotebookPanel';
import ProctoringOverlay from '../components/ProctoringOverlay';

const AI_SERVER = 'http://localhost:5200';
const IDLE_NUDGE_MS = 45000; // nudge candidate after 45s silence

export default function AIInterviewRoom() {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();

    // Chat state
    const [messages, setMessages]         = useState([]);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isListening, setIsListening]   = useState(false);
    const [interimText, setInterimText]   = useState('');
    const [isThinking, setIsThinking]     = useState(false);

    // DSA / Notebook state
    const [currentQuestion, setCurrentQuestion] = useState(null);

    // Interview meta
    const [blocked, setBlocked]         = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [ended, setEnded]             = useState(false);
    const [interviewState, setInterviewState] = useState('INIT');
    const [isRequestingHint, setIsRequestingHint] = useState(false);
    const [hintLevel, setHintLevel]   = useState(0);
    const [hintPenalty, setHintPenalty] = useState(0);

    // Camera
    const [localStream, setLocalStream] = useState(null);
    const videoRef = useRef(null);

    const socketRef       = useRef(null);
    const recognitionRef  = useRef(null);
    const synthRef        = useRef(window.speechSynthesis);
    const idleTimerRef    = useRef(null);

    // Refs for stale-closure-safe access
    const isListeningRef  = useRef(false);
    const isAiSpeakingRef = useRef(false);
    const endedRef        = useRef(false);

    useEffect(() => { isListeningRef.current  = isListening;  }, [isListening]);
    useEffect(() => { isAiSpeakingRef.current = isAiSpeaking; }, [isAiSpeaking]);
    useEffect(() => { endedRef.current        = ended;        }, [ended]);

    const jobContext = {
        jobId:         searchParams.get('jobId')      || '',
        applicationId: searchParams.get('appId')       || '',
        candidateId:   searchParams.get('candidateId') || localStorage.getItem('userId') || '',
        jobTitle:      searchParams.get('jobTitle')    || 'Software Engineer',
        companyName:   searchParams.get('company')     || 'the company',
        stageName:     searchParams.get('stage')       || 'Technical',
        skills:        (searchParams.get('skills') || '').split(',').filter(Boolean),
        questions:     []
    };

    // ── Idle nudge timer ──────────────────────────────────────────────────────
    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (endedRef.current) return;
        idleTimerRef.current = setTimeout(() => {
            if (!endedRef.current && socketRef.current?.connected) {
                socketRef.current.emit('nudge', roomId);
            }
        }, IDLE_NUDGE_MS);
    }, [roomId]);

    // ── TTS ───────────────────────────────────────────────────────────────────
    const speakText = useCallback((text) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        const clean = text.replace(/\*\*/g, '').replace(/`/g, '').replace(/#{1,6}\s/g, '').replace(/[📝⚙️💻🗒️💡✅❌⚠🎉📊🗣🏁📋💭❓🔄]/g, '');
        const utt = new SpeechSynthesisUtterance(clean);
        utt.rate = 1.0; utt.pitch = 1.0;
        utt.onstart = () => {
            setIsAiSpeaking(true);
            if (isListeningRef.current && recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (_) {}
            }
        };
        utt.onend = () => {
            setIsAiSpeaking(false);
            if (isListeningRef.current && !endedRef.current && recognitionRef.current) {
                setTimeout(() => { try { recognitionRef.current.start(); } catch (_) {} }, 300);
            }
        };
        utt.onerror = () => setIsAiSpeaking(false);
        synthRef.current.speak(utt);
    }, []);

    // ── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            // 1. Blocked check
            try {
                const res = await axios.get(`${AI_SERVER}/api/ai-interview/${roomId}/status`);
                if (res.data.status === 'Completed') {
                    setBlocked(true); setBlockReason('This interview has already been completed.');
                    return;
                }
            } catch (_) {}

            // 2. Auto-start DSA question
            try {
                const res = await axios.post(`${AI_SERVER}/api/dsa/start-interview`, { roomId });
                if (res.data.question) {
                    setCurrentQuestion({ ...res.data.question, description: res.data.message.split('\n\n').slice(2).join('\n\n').split('\n\nTake')[0] });
                    setInterviewState('QUESTION_GIVEN');
                }
            } catch (e) {
                console.warn('[AI Interview] DSA auto-start failed:', e.message);
            }

            // 3. Camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
            } catch (e) { console.warn('[AI Interview] Camera failed:', e.message); }

            // 4. Socket
            socketRef.current = io(AI_SERVER, { transports: ['websocket', 'polling'] });

            socketRef.current.on('connect', () => {
                socketRef.current.emit('join-room', roomId, jobContext);
                resetIdleTimer();
            });
            socketRef.current.on('connect_error', err => console.error('[AI] Socket error:', err.message));

            socketRef.current.on('ai-message', (text) => {
                setIsThinking(false);
                setMessages(prev => [...prev, { role: 'ai', text }]);
                speakText(text);
                resetIdleTimer(); // reset idle timer when AI responds
            });

            socketRef.current.on('interview-ended', () => {
                setIsThinking(false); setEnded(true); endedRef.current = true;
                setIsListening(false); isListeningRef.current = false;
                if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
                try { recognitionRef.current?.stop(); } catch (_) {}
                synthRef.current?.cancel();
            });

            socketRef.current.on('interview-blocked', msg => { setBlocked(true); setBlockReason(msg); });
            socketRef.current.on('ai-error', msg => {
                setIsThinking(false);
                setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${msg}` }]);
            });

            setupSpeechRecognition();
        };

        init();
        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            socketRef.current?.disconnect();
            try { recognitionRef.current?.stop(); } catch (_) {}
            synthRef.current?.cancel();
        };
    }, [roomId]); // eslint-disable-line

    useEffect(() => {
        if (videoRef.current && localStream) videoRef.current.srcObject = localStream;
    }, [localStream]);

    // ── Speech Recognition ────────────────────────────────────────────────────
    const setupSpeechRecognition = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { alert('Speech recognition not supported — please use Chrome or Edge.'); return; }

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            if (isAiSpeakingRef.current) return;
            let interim = '', final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) final += t; else interim += t;
            }
            setInterimText(interim);
            if (final.trim()) {
                const text = final.trim();
                setMessages(prev => [...prev, { role: 'candidate', text }]);
                setIsThinking(true);
                socketRef.current?.emit('candidate-message', roomId, text);
                setInterimText('');
                resetIdleTimer();
            }
        };

        recognition.onerror = (e) => {
            if (e.error === 'not-allowed') alert('Microphone access denied.');
        };

        recognition.onend = () => {
            if (isListeningRef.current && !isAiSpeakingRef.current && !endedRef.current) {
                setTimeout(() => { try { recognition.start(); } catch (_) {} }, 100);
            }
        };

        recognitionRef.current = recognition;
    };

    const startListening = () => {
        if (recognitionRef.current && !isListeningRef.current) {
            try { recognitionRef.current.start(); setIsListening(true); isListeningRef.current = true; }
            catch (e) { console.error(e); }
        }
    };

    const stopListening = () => {
        setIsListening(false); isListeningRef.current = false;
        try { recognitionRef.current?.stop(); } catch (_) {}
    };

    // ── Send text from chat or notebook ───────────────────────────────────────
    const handleSendText = useCallback((text) => {
        if (!text.trim() || isThinking) return;
        setMessages(prev => [...prev, { role: 'candidate', text }]);
        setIsThinking(true);
        socketRef.current?.emit('candidate-message', roomId, text);
        resetIdleTimer();
    }, [roomId, isThinking, resetIdleTimer]);

    // ── Hint ──────────────────────────────────────────────────────────────────
    const requestHint = useCallback(async () => {
        if (isRequestingHint || hintLevel >= 4) return;
        setIsRequestingHint(true);
        try {
            const res = await axios.post(`${AI_SERVER}/api/dsa/request-hint`, { roomId });
            const { message, hintLevel: lvl, penalty } = res.data;
            setHintLevel(lvl); setHintPenalty(penalty);
            setMessages(prev => [...prev, { role: 'ai', text: message }]);
            speakText(message);
        } catch (err) { console.error('Hint error:', err.message); }
        setIsRequestingHint(false);
    }, [roomId, isRequestingHint, hintLevel, speakText]);

    const STATE_LABELS = {
        INIT: '🔄 Starting...', QUESTION_GIVEN: '📋 Read the Problem',
        INTUITION_EXPLAINED: '💭 Refining Approach', INTUITION_APPROVED: '✅ Approach Approved',
        CODE_WRITTEN: '💻 Writing Solution', CODE_EVALUATED: '🧪 Evaluated',
        CODE_EXPLAINED: '🗣 Explanation', FOLLOW_UP: '❓ Follow-up', FINAL_FEEDBACK: '🏁 Complete'
    };

    // ── Screens ───────────────────────────────────────────────────────────────
    if (blocked) return (
        <div className="h-screen flex items-center justify-center bg-black">
            <div className="bg-[#15151a] border border-white/[0.08] rounded-2xl p-10 max-w-md text-center shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-sm text-gray-400">{blockReason}</p>
            </div>
        </div>
    );

    if (ended) return (
        <div className="h-screen flex items-center justify-center bg-black">
            <div className="bg-[#15151a] border border-white/[0.08] rounded-2xl p-10 max-w-md text-center shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Interview Complete</h2>
                <p className="text-sm text-gray-400 mb-6">Thank you! Your results will appear on your dashboard shortly.</p>
                <button onClick={() => window.close()} className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-bold text-sm">Close Window</button>
            </div>
        </div>
    );

    // ── Main ──────────────────────────────────────────────────────────────────
    return (
        <div className="h-screen flex flex-col bg-black overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Top Bar */}
            <div className="h-9 bg-[#0d0d12] border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0">
                <span className="text-[11px] font-bold tracking-wide">
                    {isThinking
                        ? <span className="flex items-center gap-1.5 text-violet-400">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            AI is thinking...
                          </span>
                        : <span className="text-indigo-400">{STATE_LABELS[interviewState] || interviewState}</span>
                    }
                </span>
                <div className="flex items-center gap-3">
                    {hintLevel > 0 && <span className="text-[10px] text-yellow-400 font-semibold">💡 {hintLevel}/4 hints · -{hintPenalty}%</span>}
                    <span className="text-[10px] text-gray-600 font-mono">{roomId}</span>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <ProctoringOverlay socketRef={socketRef} roomId={roomId} videoRef={videoRef} />

                {/* Left: Chat */}
                <AIChatPanel
                    messages={messages} interimText={interimText}
                    isListening={isListening} isThinking={isThinking} isAiSpeaking={isAiSpeaking}
                    onStartListening={startListening} onStopListening={stopListening}
                    onSendText={handleSendText}
                />

                {/* Center: Notebook */}
                <NotebookPanel
                    question={currentQuestion}
                    onSendToAI={handleSendText}
                    isThinking={isThinking}
                />

                {/* Right: Camera + Controls */}
                <div className="w-56 border-l border-white/[0.05] bg-[#0d0d12] flex flex-col items-center p-3 gap-3">
                    <AIAvatar isSpeaking={isAiSpeaking} />

                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/[0.08] relative">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">You</div>
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
                    </div>

                    <div className="w-full mt-auto flex flex-col gap-2">
                        {/* Hint */}
                        <button onClick={requestHint} disabled={isRequestingHint || hintLevel >= 4}
                            className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                                hintLevel >= 4 ? 'border-white/[0.05] text-gray-600 cursor-not-allowed'
                                : isRequestingHint ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500'
                                : 'border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400'}`}>
                            💡 {hintLevel >= 4 ? 'No more hints' : `Hint (${hintLevel}/4)`}
                        </button>

                        {/* End */}
                        <button onClick={() => {
                            if (window.confirm('End early? Progress will be evaluated.')) {
                                setIsThinking(true);
                                socketRef.current?.emit('candidate-message', roomId, 'I would like to end the interview now. INTERVIEW_COMPLETE');
                            }
                        }} className="w-full py-2 rounded-xl font-bold text-xs bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-colors">
                            End Interview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
