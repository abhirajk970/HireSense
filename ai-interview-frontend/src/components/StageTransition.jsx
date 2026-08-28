import React, { useEffect, useState } from 'react';

export default function StageTransition({ targetStage, onComplete }) {
    const [count, setCount] = useState(3);

    const STAGE_CONFIG = {
        DSA: {
            title: "Round 2: Technical & DSA",
            subtitle: "Problem Solving, Data Structures, and Algorithm Design",
            icon: "💻",
            color: "from-blue-600 to-indigo-600",
            desc: "You will be presented with a coding problem. Explain your approach and intuition before writing code."
        },
        LP: {
            title: "Round 3: Leadership & Behavioral",
            subtitle: "Amazon Leadership Principles & Situational Questions",
            icon: "🤝",
            color: "from-violet-600 to-purple-600",
            desc: "We will discuss 3 situational questions. Use the STAR method (Situation, Task, Action, Result) to structure your answers."
        },
        DONE: {
            title: "Interview Complete",
            subtitle: "Thank you for completing the SDE Demo Interview!",
            icon: "🎉",
            color: "from-emerald-600 to-teal-600",
            desc: "Your responses and code have been recorded. Evaluating your performance..."
        }
    };

    const config = STAGE_CONFIG[targetStage] || STAGE_CONFIG.DSA;

    useEffect(() => {
        const timer = setInterval(() => {
            setCount((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setTimeout(onComplete, 300);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
            <div className="max-w-xl w-full bg-[#12121a] border border-white/[0.1] rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
                {/* Background ambient glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr border border-white/20 flex items-center justify-center text-4xl mb-6 shadow-xl animate-bounce">
                    <div className={`w-full h-full rounded-2xl bg-gradient-to-tr ${config.color} flex items-center justify-center`}>
                        {config.icon}
                    </div>
                </div>

                <div className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-2">
                    Advancing Stage
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                    {config.title}
                </h1>

                <p className="text-sm font-medium text-gray-300 mb-4">
                    {config.subtitle}
                </p>

                <p className="text-xs text-gray-400 max-w-md mb-8 leading-relaxed">
                    {config.desc}
                </p>

                {/* Countdown pill */}
                <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.1] px-6 py-3 rounded-2xl">
                    <span className="text-xs text-gray-400">Starting round in</span>
                    <span className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-sm flex items-center justify-center animate-pulse">
                        {count > 0 ? count : '🚀'}
                    </span>
                </div>
            </div>
        </div>
    );
}
