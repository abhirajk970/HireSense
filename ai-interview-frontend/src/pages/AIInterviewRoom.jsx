import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import AIChatPanel from '../components/AIChatPanel';
import AIAvatar from '../components/AIAvatar';
import NotebookPanel from '../components/NotebookPanel';
import ProctoringOverlay from '../components/ProctoringOverlay';
import EditorView from '../components/EditorView';
import StageTransition from '../components/StageTransition';
import LPStage from '../components/LPStage';

const AI_SERVER = 'http://localhost:5200';
const WHISPER_SERVER = 'http://localhost:8000';
const IDLE_NUDGE_MS = 45000; // nudge candidate after 45s silence
const SILENCE_THRESHOLD = 0.01; // RMS threshold below which we consider silence
const SILENCE_SEND_MS = 2500; // send to Whisper after 2.5s of silence
const MIN_RECORDING_MS = 600; // minimum recording length to avoid empty sends

export default function AIInterviewRoom() {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();

    // Chat state
    const [messages, setMessages]         = useState([]);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isListening, setIsListening]   = useState(false);
    const [interimText, setInterimText]   = useState('');
    const [accumulatedSpeech, setAccumulatedSpeech] = useState('');
    const [isThinking, setIsThinking]     = useState(false);

    // DSA / Notebook state
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [dsaRevealed, setDsaRevealed] = useState(false);

    // Code Editor states
    const [code, setCode]                 = useState('');
    const [language, setLanguage]         = useState('javascript');
    const [centerTab, setCenterTab]       = useState('notebook');
    const [isMuted, setIsMuted]           = useState(false);
    const [thoughtTimer, setThoughtTimer] = useState(null);

    // Interview meta
    const [blocked, setBlocked]         = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [ended, setEnded]             = useState(false);
    const [interviewState, setInterviewState] = useState('INIT');
    const [interviewStage, setInterviewStage] = useState('INTRO'); // 'INTRO' | 'DSA' | 'LP' | 'DONE'
    const [transitioningTo, setTransitioningTo] = useState(null);
    const [lpQuestion, setLpQuestion] = useState(null);
    const [lpIndex, setLpIndex] = useState(1);
    const [lpTotal, setLpTotal] = useState(3);
    const [isRequestingHint, setIsRequestingHint] = useState(false);
    const [hintLevel, setHintLevel]   = useState(0);
    const [hintPenalty, setHintPenalty] = useState(0);

    // Camera
    const [localStream, setLocalStream] = useState(null);
    const videoRef = useRef(null);

    const socketRef       = useRef(null);
    const synthRef        = useRef(window.speechSynthesis);
    const idleTimerRef    = useRef(null);

    // Local Whisper Audio Recording References
    const audioContextRef     = useRef(null);
    const analyserRef         = useRef(null);
    const processorRef        = useRef(null);
    const sourceRef           = useRef(null);
    const audioStreamRef      = useRef(null);
    const pcmBufferRef        = useRef([]);   // stores Float32 PCM chunks
    const recordingStartRef   = useRef(null); // timestamp when recording started
    const silenceTimerRef     = useRef(null);
    const isTranscribingRef   = useRef(false);
    const accumulatedSpeechRef = useRef('');
    const startListeningRef   = useRef(null); // ref to break stale closure in speakText
    const hasReceivedAiMsgRef = useRef(false); // gate auto-mic to only after first AI message
    const handleSendTextRef   = useRef(null);
    const stopWhisperRecordingRef = useRef(null);
    const stopListeningRef    = useRef(null);

    // Refs for stale-closure-safe access
    const isListeningRef  = useRef(false);
    const isAiSpeakingRef = useRef(false);
    const endedRef        = useRef(false);
    const isMutedRef      = useRef(false);

    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    useEffect(() => { isListeningRef.current  = isListening;  }, [isListening]);
    useEffect(() => { isAiSpeakingRef.current = isAiSpeaking; }, [isAiSpeaking]);
    useEffect(() => { endedRef.current        = ended;        }, [ended]);
    useEffect(() => { accumulatedSpeechRef.current = accumulatedSpeech; }, [accumulatedSpeech]);

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

    // ── Send text from chat or notebook ───────────────────────────────────────
    const handleSendText = useCallback((text) => {
        if (!text.trim() || isThinking) return;

        // Immediately turn off mic if active to block overlapping inputs
        if (isListeningRef.current) {
            setIsListening(false);
            isListeningRef.current = false;
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            setAccumulatedSpeech('');
            setInterimText('');
            stopWhisperRecordingRef.current?.();
        }

        setMessages(prev => [...prev, { role: 'candidate', text }]);
        setIsThinking(true);
        socketRef.current?.emit('candidate-message', roomId, text);
        resetIdleTimer();
    }, [roomId, isThinking, resetIdleTimer]);

    useEffect(() => { handleSendTextRef.current = handleSendText; }, [handleSendText]);

    // ── WAV Encoding Utility ──────────────────────────────────────────────────
    const encodeWAV = useCallback((pcmFloat32, sampleRate) => {
        // Downsample to 16kHz for Whisper
        const targetRate = 16000;
        const ratio = sampleRate / targetRate;
        const newLength = Math.round(pcmFloat32.length / ratio);
        const downsampled = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
            downsampled[i] = pcmFloat32[Math.round(i * ratio)];
        }

        // Convert Float32 → Int16 PCM
        const int16 = new Int16Array(downsampled.length);
        for (let i = 0; i < downsampled.length; i++) {
            const s = Math.max(-1, Math.min(1, downsampled[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Build WAV header + data
        const wavBuffer = new ArrayBuffer(44 + int16.length * 2);
        const view = new DataView(wavBuffer);
        const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };

        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + int16.length * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);        // SubChunk1Size
        view.setUint16(20, 1, true);         // PCM format
        view.setUint16(22, 1, true);         // Mono
        view.setUint32(24, targetRate, true); // SampleRate
        view.setUint32(28, targetRate * 2, true); // ByteRate
        view.setUint16(32, 2, true);         // BlockAlign
        view.setUint16(34, 16, true);        // BitsPerSample
        writeStr(36, 'data');
        view.setUint32(40, int16.length * 2, true);

        // Copy PCM data
        const uint8 = new Uint8Array(wavBuffer);
        const int16Bytes = new Uint8Array(int16.buffer);
        uint8.set(int16Bytes, 44);

        return wavBuffer;
    }, []);

    // ── Send audio buffer to local Whisper ────────────────────────────────────
    const sendToWhisper = useCallback(async (pcmChunks, sampleRate) => {
        if (pcmChunks.length === 0 || isTranscribingRef.current) return;

        // Merge all PCM chunks into a single Float32Array
        const totalLength = pcmChunks.reduce((acc, c) => acc + c.length, 0);
        if (totalLength < sampleRate * 0.3) return; // skip very short clips (< 0.3s)

        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of pcmChunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
        }

        // Encode to WAV
        const wavBuffer = encodeWAV(merged, sampleRate);
        const base64Audio = btoa(
            new Uint8Array(wavBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        isTranscribingRef.current = true;
        setInterimText('🎙️ Transcribing...');

        try {
            const res = await axios.post(`${WHISPER_SERVER}/transcribe`, { audio: base64Audio }, { timeout: 30000 });
            const transcription = res.data?.text?.trim();

            if (transcription && transcription.length > 0) {
                console.log('[Whisper Local] Got:', transcription);
                setAccumulatedSpeech(prev => {
                    const next = prev ? prev + ' ' + transcription : transcription;
                    return next;
                });
                resetIdleTimer();
                setInterimText(transcription);

                // After receiving transcription, start a 3-second timer to auto-send
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                    const finalText = accumulatedSpeechRef.current.trim();
                    if (finalText && !isAiSpeakingRef.current && !endedRef.current) {
                        handleSendTextRef.current?.(finalText);
                        setAccumulatedSpeech('');
                        setInterimText('');
                    }
                }, 3000);
            } else {
                setInterimText('');
            }
        } catch (err) {
            console.error('[Whisper Local] Transcription error:', err.message);
            setInterimText('');
        } finally {
            isTranscribingRef.current = false;
        }
    }, [encodeWAV, resetIdleTimer]);

    // ── Local Whisper Recording Setup ─────────────────────────────────────────
    const startWhisperRecording = useCallback(async () => {
        if (audioContextRef.current) return; // already recording

        try {
            const stream = audioStreamRef.current || await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;

            // Analyser for silence detection
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;
            source.connect(analyser);

            // ScriptProcessor to capture raw PCM
            const bufferSize = 4096;
            const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
            processorRef.current = processor;

            pcmBufferRef.current = [];
            recordingStartRef.current = Date.now();
            let lastSpeechTime = Date.now();
            let hasSpeechInWindow = false;

            processor.onaudioprocess = (e) => {
                if (!isListeningRef.current || isAiSpeakingRef.current || endedRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const copy = new Float32Array(inputData.length);
                copy.set(inputData);

                // Calculate RMS for silence detection
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);

                if (rms > SILENCE_THRESHOLD) {
                    // Speech detected
                    lastSpeechTime = Date.now();
                    hasSpeechInWindow = true;
                    pcmBufferRef.current.push(copy);
                    setInterimText('🎙️ Listening...');
                } else {
                    // Silence detected — still record to capture trailing audio
                    pcmBufferRef.current.push(copy);

                    const silenceDuration = Date.now() - lastSpeechTime;
                    const recordingDuration = Date.now() - recordingStartRef.current;

                    if (silenceDuration >= SILENCE_SEND_MS && recordingDuration >= MIN_RECORDING_MS && pcmBufferRef.current.length > 0) {
                        if (hasSpeechInWindow) {
                            // Harvest the buffer and send to Whisper
                            const chunks = [...pcmBufferRef.current];
                            pcmBufferRef.current = [];
                            recordingStartRef.current = Date.now();
                            lastSpeechTime = Date.now();
                            hasSpeechInWindow = false;

                            sendToWhisper(chunks, audioCtx.sampleRate);
                        } else {
                            // Silently purge the buffer and reset timers
                            pcmBufferRef.current = [];
                            recordingStartRef.current = Date.now();
                            lastSpeechTime = Date.now();
                        }
                    }
                }
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);

            console.log('[Whisper Local] Recording started at', audioCtx.sampleRate, 'Hz');
        } catch (err) {
            console.error('[Whisper Local] Failed to start recording:', err);
        }
    }, [sendToWhisper]);

    const stopWhisperRecording = useCallback(() => {
        // Send any remaining audio buffer
        if (pcmBufferRef.current.length > 0 && audioContextRef.current) {
            const chunks = [...pcmBufferRef.current];
            pcmBufferRef.current = [];
            sendToWhisper(chunks, audioContextRef.current.sampleRate);
        }

        // Disconnect nodes
        try { processorRef.current?.disconnect(); } catch (_) {}
        try { sourceRef.current?.disconnect(); } catch (_) {}
        try { analyserRef.current?.disconnect(); } catch (_) {}
        try { audioContextRef.current?.close(); } catch (_) {}

        processorRef.current = null;
        sourceRef.current = null;
        analyserRef.current = null;
        audioContextRef.current = null;

        console.log('[Whisper Local] Recording stopped');
    }, [sendToWhisper]);

    useEffect(() => { stopWhisperRecordingRef.current = stopWhisperRecording; }, [stopWhisperRecording]);

    // ── TTS ───────────────────────────────────────────────────────────────────
    const speakText = useCallback((text) => {
        hasReceivedAiMsgRef.current = true;

        if (!synthRef.current || isMutedRef.current) {
            // Even when muted, auto-start mic after AI's turn
            setTimeout(() => {
                pcmBufferRef.current = [];
                recordingStartRef.current = Date.now();
                startListeningRef.current?.();
            }, 400);
            return;
        }
        synthRef.current.cancel();
        const clean = text.replace(/\*\*/g, '').replace(/`/g, '').replace(/#{1,6}\s/g, '').replace(/[📝⚙️💻🗒️💡✅❌⚠🎉📊🗣🏁📋💭❓🔄]/g, '');
        const utt = new SpeechSynthesisUtterance(clean);
        utt.rate = 1.0; utt.pitch = 1.0;
        utt.onstart = () => {
            isAiSpeakingRef.current = true;
            setIsAiSpeaking(true);
            // onaudioprocess handler already gates on isAiSpeakingRef — mic effectively paused
        };
        utt.onend = () => {
            isAiSpeakingRef.current = false;
            setIsAiSpeaking(false);
            if (!endedRef.current) {
                // Clear PCM buffer to discard any TTS echo leak, then auto-start mic
                pcmBufferRef.current = [];
                recordingStartRef.current = Date.now();
                // Small delay to let TTS audio fully stop before capturing
                setTimeout(() => {
                    startListeningRef.current?.();
                }, 400);
            }
        };
        utt.onerror = () => {
            isAiSpeakingRef.current = false;
            setIsAiSpeaking(false);
        };
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

            // 2. We no longer auto-start the DSA question on load. 
            // The backend handles phase progression via time elapsed.

            // 3. Camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                audioStreamRef.current = stream; // reuse for Whisper recording
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
                resetIdleTimer();
            });

            socketRef.current.on('show-dsa-question', (questionData) => {
                if (questionData) {
                    setCurrentQuestion(questionData);
                    setDsaRevealed(true);
                    setInterviewState('QUESTION_GIVEN');
                    const funcName = questionData.functionName || 'solution';
                    setCode(`function ${funcName}() {\n    // Write your code here\n    \n}`);
                    setCenterTab('notebook');
                    setThoughtTimer(120);
                    speakText(`Here is your coding challenge: ${questionData.title}. ${questionData.description}. Take a moment to read it over, and let me know your thoughts when you are ready.`);
                }
            });

            socketRef.current.on('stage-advance', (payload) => {
                if (payload && payload.stage) {
                    if (payload.stage === 'DONE') {
                        setEnded(true);
                        endedRef.current = true;
                    } else {
                        setTransitioningTo(payload.stage);
                    }
                }
            });

            socketRef.current.on('dsa-action', (payload) => {
                if (payload) {
                    if (payload.action === 'code_directly') {
                        setInterviewState('INTUITION_APPROVED');
                        setCenterTab('editor');
                    } else if (payload.action === 'write_algo') {
                        setInterviewState('INTUITION_EXPLAINED');
                        setCenterTab('notebook');
                    }
                }
            });

            socketRef.current.on('lp-progress', (payload) => {
                if (payload) {
                    if (payload.question) setLpQuestion(payload.question);
                    if (payload.index) setLpIndex(payload.index);
                    if (payload.total) setLpTotal(payload.total);
                }
            });

            socketRef.current.on('reconnect-sync', (syncData) => {
                if (syncData) {
                    if (syncData.question) {
                        setCurrentQuestion(syncData.question);
                        setDsaRevealed(true);
                    }
                    if (syncData.interviewState) {
                        setInterviewState(syncData.interviewState);
                    }
                    if (syncData.code) {
                        setCode(syncData.code);
                    }
                    if (syncData.language) {
                        setLanguage(syncData.language);
                    }
                    if (syncData.hintLevel !== undefined) {
                        setHintLevel(syncData.hintLevel);
                    }
                    if (syncData.hintPenalty !== undefined) {
                        setHintPenalty(syncData.hintPenalty);
                    }
                    setThoughtTimer(null);
                }
            });

            socketRef.current.on('interview-ended', () => {
                setIsThinking(false); setEnded(true); endedRef.current = true;
                setIsListening(false); isListeningRef.current = false;
                if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
                stopWhisperRecording();
                synthRef.current?.cancel();
            });

            socketRef.current.on('interview-blocked', msg => { setBlocked(true); setBlockReason(msg); });
            socketRef.current.on('ai-error', msg => {
                setIsThinking(false);
                setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${msg}` }]);
            });
        };

        init();
        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            socketRef.current?.disconnect();
            stopWhisperRecording();
            synthRef.current?.cancel();
        };
    }, [roomId]); // eslint-disable-line

    useEffect(() => {
        if (videoRef.current && localStream) videoRef.current.srcObject = localStream;
    }, [localStream]);

    // debounced code sync to server via sockets
    useEffect(() => {
        if (!code || !roomId || !socketRef.current?.connected) return;
        const t = setTimeout(() => {
            socketRef.current.emit('code-snapshot', roomId, code, language);
        }, 1500);
        return () => clearTimeout(t);
    }, [code, language, roomId]);

    // countdown driver for 2-minute thought timer
    useEffect(() => {
        if (thoughtTimer === null || thoughtTimer <= 0) return;
        const interval = setInterval(() => {
            setThoughtTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSendText("[Thought Timer Finished] I have gathered my thoughts. Let's discuss my approach.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [thoughtTimer]);

    // ── Mic Controls (Local Whisper) ──────────────────────────────────────────
    const startListening = useCallback(() => {
        if (isListeningRef.current) return;
        if (isThinking || isAiSpeakingRef.current) return; // Prevent mic from turning on while AI is busy
        setIsListening(true);
        isListeningRef.current = true;
        startWhisperRecording();
    }, [startWhisperRecording, isThinking]);

    // Keep ref in sync so speakText's onend can call it without stale closure
    useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

    const stopListening = useCallback(() => {
        setIsListening(false);
        isListeningRef.current = false;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Send any accumulated text when mic is turned off
        const textToSend = accumulatedSpeechRef.current.trim();
        if (textToSend) {
            handleSendTextRef.current?.(textToSend);
            setAccumulatedSpeech('');
            setInterimText('');
        }

        stopWhisperRecordingRef.current?.();
    }, []);

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

    useEffect(() => { handleSendTextRef.current = handleSendText; }, [handleSendText]);
    useEffect(() => { stopWhisperRecordingRef.current = stopWhisperRecording; }, [stopWhisperRecording]);
    useEffect(() => { stopListeningRef.current = stopListening; }, [stopListening]);

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

            {transitioningTo && (
                <StageTransition
                    targetStage={transitioningTo}
                    onComplete={() => {
                        setInterviewStage(transitioningTo);
                        setTransitioningTo(null);
                    }}
                />
            )}

            <div className="flex flex-1 overflow-hidden relative">
                <ProctoringOverlay socketRef={socketRef} roomId={roomId} videoRef={videoRef} />

                {/* Left: Chat */}
                <AIChatPanel
                    messages={messages} interimText={interimText} accumulatedSpeech={accumulatedSpeech}
                    isListening={isListening} isThinking={isThinking} isAiSpeaking={isAiSpeaking}
                    onStartListening={startListening} onStopListening={stopListening}
                    onSendText={handleSendText}
                />

                {/* Main Content Area based on Stage */}
                {interviewStage === 'INTRO' ? (
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0c11] relative p-4">
                        <AIAvatar isSpeaking={isAiSpeaking} large={true} stageName="Round 1: Intro & Projects" />
                        
                        {/* Floating candidate camera bottom-right */}
                        <div className="absolute bottom-8 right-8 w-60 aspect-video bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-20">
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md">You</div>
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                        </div>
                    </div>
                ) : interviewStage === 'LP' ? (
                    <>
                        <LPStage
                            currentQuestion={lpQuestion}
                            questionIndex={lpIndex}
                            totalQuestions={lpTotal}
                            isThinking={isThinking}
                            onSendResponse={handleSendText}
                        />
                        {/* Right: Camera + Controls */}
                        <div className="w-56 border-l border-white/[0.05] bg-[#0d0d12] flex flex-col items-center p-3 gap-3">
                            <AIAvatar isSpeaking={isAiSpeaking} stageName="Round 3" />

                            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/[0.08] relative">
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                                <div className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">You</div>
                                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
                            </div>

                            <div className="w-full mt-auto flex flex-col gap-2">
                                <button onClick={() => {
                                    if (!isMuted) synthRef.current?.cancel();
                                    setIsMuted(!isMuted);
                                }}
                                    className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                                        isMuted 
                                        ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                                        : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 hover:text-white'}`}>
                                    {isMuted ? '🔇 AI Speech: Muted' : '🔊 AI Speech: On'}
                                </button>
                                <button onClick={() => {
                                    if (window.confirm("Do you really want to close the interview? You'll lose all your progress.")) {
                                        setIsThinking(true);
                                        socketRef.current?.emit('end-interview', roomId);
                                    }
                                }} className="w-full py-2 rounded-xl font-bold text-xs bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-colors">
                                    End Interview
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Center Panel (DSA) */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0c11]">
                            {/* Glassmorphic Tab switcher & Thought Timer */}
                            {dsaRevealed && (
                                <div className="flex-shrink-0 bg-[#0d0d12]/90 border-b border-white/[0.06] p-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCenterTab('notebook')}
                                            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-xl transition-all ${
                                                centerTab === 'notebook'
                                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            📓 Unified Notebook
                                        </button>
                                        <button
                                            onClick={() => setCenterTab('editor')}
                                            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-xl transition-all ${
                                                centerTab === 'editor'
                                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            💻 IDE Workspace
                                        </button>
                                    </div>

                                    {/* Glowing countdown timer pill */}
                                    {thoughtTimer !== null && (
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all ${
                                            thoughtTimer > 0 
                                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 animate-pulse' 
                                            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                        }`}>
                                            <span>⏳</span>
                                            <span>{thoughtTimer > 0 ? `Thought Timer: ${Math.floor(thoughtTimer / 60)}:${thoughtTimer % 60 < 10 ? '0' : ''}${thoughtTimer % 60}` : 'Time to explain approach!'}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex-1 flex flex-col overflow-hidden">
                                {centerTab === 'notebook' ? (
                                    <NotebookPanel
                                        question={currentQuestion}
                                        onSendToAI={handleSendText}
                                        isThinking={isThinking}
                                        dsaRevealed={dsaRevealed}
                                    />
                                ) : (
                                    <EditorView
                                        code={code}
                                        language={language}
                                        onCodeChange={setCode}
                                        onLanguageChange={setLanguage}
                                        roomId={roomId}
                                        onRunComplete={({ testResults, message, state }) => {
                                            setMessages(prev => [...prev, { role: 'ai', text: message }]);
                                            speakText(message);
                                            if (state) setInterviewState(state);
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right: Camera + Controls */}
                        <div className="w-56 border-l border-white/[0.05] bg-[#0d0d12] flex flex-col items-center p-3 gap-3">
                            <AIAvatar isSpeaking={isAiSpeaking} stageName="Round 2" />

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

                                {/* Mute AI Speech */}
                                <button onClick={() => {
                                    if (!isMuted) {
                                        synthRef.current?.cancel();
                                    }
                                    setIsMuted(!isMuted);
                                }}
                                    className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                                        isMuted 
                                        ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                                        : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 hover:text-white'}`}>
                                    {isMuted ? '🔇 AI Speech: Muted' : '🔊 AI Speech: On'}
                                </button>

                                {/* End */}
                                <button onClick={() => {
                                    if (window.confirm("Do you really want to close the interview? You'll lose all your progress.")) {
                                        setIsThinking(true);
                                        socketRef.current?.emit('end-interview', roomId);
                                    }
                                }} className="w-full py-2 rounded-xl font-bold text-xs bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-colors">
                                    End Interview
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
