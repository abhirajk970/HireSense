import React from 'react';

export default function AIAvatar({ isSpeaking, large = false, stageName = 'AI Interviewer' }) {
    if (large) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-[#0c0c16] via-[#101024] to-[#0a0a14] rounded-2xl overflow-hidden border border-white/[0.08] relative flex flex-col items-center justify-center shadow-2xl p-8">
                {/* Background ambient glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className={`w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-3xl transition-all duration-700 ${isSpeaking ? 'scale-125 bg-indigo-500/20' : 'scale-100 animate-pulse'}`} />
                    <div className={`w-[250px] h-[250px] rounded-full bg-violet-600/10 blur-3xl transition-all duration-700 ${isSpeaking ? 'scale-125 bg-violet-600/20' : 'scale-100'}`} />
                </div>

                {/* Concentric sound wave rings when speaking */}
                <div className="relative flex items-center justify-center my-auto">
                    {isSpeaking && (
                        <>
                            <div className="absolute w-48 h-48 rounded-full border border-indigo-500/30 animate-ping" style={{ animationDuration: '1.2s' }} />
                            <div className="absolute w-64 h-64 rounded-full border border-violet-500/20 animate-ping" style={{ animationDuration: '1.8s' }} />
                            <div className="absolute w-80 h-80 rounded-full border border-indigo-400/10 animate-ping" style={{ animationDuration: '2.4s' }} />
                        </>
                    )}

                    {/* Main Circular Avatar */}
                    <div className={`relative z-10 w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-1 shadow-2xl transition-all duration-500 ${isSpeaking ? 'shadow-indigo-500/50 scale-110' : 'shadow-indigo-500/20 scale-100 animate-pulse'}`}>
                        <div className="w-full h-full bg-[#0d0d1a] rounded-full flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Inner logo glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20" />
                            
                            {/* Icon */}
                            <svg className={`w-14 h-14 text-white transition-transform duration-300 ${isSpeaking ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* EQ Bars and Status */}
                <div className="mt-8 flex flex-col items-center gap-3 z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                            Alex
                        </span>
                        <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                            Senior Tech Lead · {stageName}
                        </span>
                    </div>

                    {/* EQ Visualizer bars when speaking */}
                    <div className="h-6 flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                        {isSpeaking ? (
                            <>
                                <div className="w-1 bg-indigo-400 rounded-full animate-[bounce_0.8s_infinite_100ms] h-4" />
                                <div className="w-1 bg-violet-400 rounded-full animate-[bounce_0.8s_infinite_300ms] h-6" />
                                <div className="w-1 bg-indigo-300 rounded-full animate-[bounce_0.8s_infinite_200ms] h-3" />
                                <div className="w-1 bg-violet-300 rounded-full animate-[bounce_0.8s_infinite_400ms] h-5" />
                                <div className="w-1 bg-indigo-400 rounded-full animate-[bounce_0.8s_infinite_150ms] h-4" />
                                <span className="ml-2 text-xs font-medium text-indigo-300 animate-pulse">Speaking...</span>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Listening to you...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Corner Stage Label */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-xl backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-300">Live Video Interview</span>
                </div>
            </div>
        );
    }

    // Default sidebar / compact view
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
