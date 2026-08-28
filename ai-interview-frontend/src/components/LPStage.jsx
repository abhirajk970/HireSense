import React from 'react';

export default function LPStage({ currentQuestion, questionIndex = 1, totalQuestions = 3, isThinking, onSendResponse }) {
    return (
        <div className="flex-1 flex flex-col bg-[#0c0c11] p-6 overflow-y-auto">
            <div className="max-w-3xl w-full mx-auto flex flex-col gap-6 my-auto">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                            Round 3: Leadership Principles
                        </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08]">
                        Question {questionIndex} of {totalQuestions}
                    </span>
                </div>

                {/* Question Card */}
                <div className="bg-gradient-to-br from-[#131320] to-[#0e0e18] border border-violet-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-xl flex-shrink-0 text-violet-300">
                            🤝
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wide mb-2">
                                Behavioral Question
                            </h3>
                            <p className="text-xl md:text-2xl font-extrabold text-white leading-relaxed">
                                "{currentQuestion || 'Tell me about a time you had to push back on a technical decision you disagreed with. What happened and what did you learn?'}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* STAR Method Guide */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {[
                        { letter: 'S', title: 'Situation', desc: 'Set the scene and provide context' },
                        { letter: 'T', title: 'Task', desc: 'Describe what your responsibility was' },
                        { letter: 'A', title: 'Action', desc: 'Explain exact steps YOU took' },
                        { letter: 'R', title: 'Result', desc: 'Share outcomes and metrics' }
                    ].map((item) => (
                        <div key={item.letter} className="bg-[#101018] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-1 hover:border-violet-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-300 font-extrabold text-xs flex items-center justify-center">
                                    {item.letter}
                                </span>
                                <span className="text-xs font-bold text-gray-200">{item.title}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-normal">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Helper prompt banner */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2.5">
                        <span className="text-base">🎙️</span>
                        <span>Speak naturally or type your answer in the chat panel on the left.</span>
                    </div>
                    {isThinking && (
                        <span className="text-violet-400 font-semibold animate-pulse flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                            AI is evaluating response...
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
