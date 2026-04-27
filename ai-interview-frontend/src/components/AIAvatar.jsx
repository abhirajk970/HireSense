import React from 'react';

export default function AIAvatar({ isSpeaking }) {
    return (
        <div className="w-full aspect-video bg-gradient-to-br from-[#0d0d20] to-[#0a0a15] rounded-xl overflow-hidden border border-white/[0.08] relative flex items-center justify-center">
            {/* Animated rings when speaking */}
            <div className="relative">
                {isSpeaking && (
                    <>
                        <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-indigo-500/30 animate-ping" style={{animationDuration:'1.5s'}} />
                        <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-violet-500/20 animate-ping" style={{animationDuration:'2s'}} />
                    </>
                )}
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl transition-all duration-300 ${isSpeaking ? 'shadow-indigo-500/40 scale-110' : 'shadow-indigo-500/10 scale-100'}`}>
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">AI Interviewer</div>
            {isSpeaking && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Speaking
                </div>
            )}
        </div>
    );
}
