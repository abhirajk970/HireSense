import React, { useRef, useEffect, useState } from 'react';

export default function AIChatPanel({
    messages,
    interimText,
    isListening,
    isThinking,
    isAiSpeaking,
    onStartListening,
    onStopListening,
    onSendText       // ← new prop: callback(text) to send typed message
}) {
    const bottomRef  = useRef(null);
    const inputRef   = useRef(null);
    const [draft, setDraft] = useState('');

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, interimText, isThinking]);

    const handleSend = () => {
        const text = draft.trim();
        if (!text || isThinking) return;
        onSendText?.(text);
        setDraft('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-96 border-r border-white/[0.05] bg-[#0a0a0f] flex flex-col h-full">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="p-4 border-b border-white/[0.05] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                    AI
                </div>
                <div>
                    <h2 className="text-sm font-bold text-white">AI Interviewer</h2>
                    <div className="flex items-center gap-1.5 text-[10px]">
                        {isThinking ? (
                            <>
                                <svg className="w-3 h-3 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                <span className="text-violet-400 font-medium">Thinking...</span>
                            </>
                        ) : isAiSpeaking ? (
                            <>
                                <div className="flex gap-0.5 items-end h-3">
                                    {[0, 100, 200, 150, 250].map((delay, i) => (
                                        <div key={i} className="w-0.5 bg-indigo-400 rounded-full animate-bounce"
                                            style={{ height: [6, 12, 8, 12, 4][i], animationDelay: `${delay}ms` }}/>
                                    ))}
                                </div>
                                <span className="text-indigo-400 font-medium">Speaking...</span>
                            </>
                        ) : (
                            <>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-emerald-400 font-medium">Active</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Messages ───────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isThinking && (
                    <div className="text-center text-gray-600 text-xs mt-10">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                            </svg>
                        </div>
                        <p>Connecting to AI interviewer...</p>
                        <p className="text-gray-700 mt-1 text-[10px]">Type or speak your responses below</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'ai'
                                ? 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/20 rounded-tl-sm'
                                : 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20 rounded-tr-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {/* Live voice transcription preview */}
                {interimText && (
                    <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm bg-gray-800/50 text-gray-400 border border-gray-700/30 italic">
                            {interimText}...
                        </div>
                    </div>
                )}

                {/* Thinking bubble */}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-sm px-5 py-3 flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* ── Text Input ─────────────────────────────────────────────── */}
            <div className="border-t border-white/[0.05] p-3 flex flex-col gap-2">
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={inputRef}
                        rows={2}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isThinking}
                        placeholder={isThinking ? 'Waiting for AI...' : 'Type your response here... (Enter to send)'}
                        className={`flex-1 bg-[#13131a] border rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none outline-none transition-colors font-sans leading-relaxed ${
                            isThinking
                                ? 'border-white/[0.04] text-gray-600 cursor-not-allowed'
                                : 'border-white/[0.08] focus:border-indigo-500/50'
                        }`}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!draft.trim() || isThinking}
                        className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                            !draft.trim() || isThinking
                                ? 'bg-white/[0.04] text-gray-600 cursor-not-allowed'
                                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                        </svg>
                    </button>
                </div>

                {/* Voice / status strip */}
                <div className="flex items-center justify-between">
                    {/* Voice toggle button */}
                    <button
                        onClick={isListening ? onStopListening : onStartListening}
                        disabled={isAiSpeaking || isThinking}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                            isAiSpeaking || isThinking
                                ? 'text-gray-600 cursor-not-allowed'
                                : isListening
                                    ? 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'
                                    : 'bg-white/[0.05] text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20'
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-2a5 5 0 01-10 0H3a7.001 7.001 0 006 6.93V17H6v2h8v-2h-3v-2.07z" clipRule="evenodd"/>
                        </svg>
                        {isAiSpeaking ? 'AI speaking' : isListening ? 'Mic ON' : 'Use mic'}
                    </button>

                    {/* Status text */}
                    <span className="text-[10px] text-gray-600">
                        {isAiSpeaking ? '🔊 Mic paused' : isListening ? '🎙 Listening...' : isThinking ? '⏳ Processing...' : 'Shift+Enter for newline'}
                    </span>
                </div>
            </div>
        </div>
    );
}
