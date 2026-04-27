import React, { useState, useRef } from 'react';

const TABS = [
    { id: 'approach',   icon: '📝', label: 'Approach',   placeholder: 'Describe your high-level approach and intuition.\n\nWhat pattern does this problem follow?\nWhat is your initial thought process?' },
    { id: 'algorithm',  icon: '⚙️', label: 'Algorithm',  placeholder: 'Write your step-by-step algorithm:\n\n1. \n2. \n3. \n\nTime complexity: O(?)\nSpace complexity: O(?)' },
    { id: 'pseudocode', icon: '💻', label: 'Pseudocode', placeholder: 'function solution(input):\n    // write your pseudocode here\n    \n    return result' },
    { id: 'notes',      icon: '🗒️', label: 'Notes',      placeholder: 'Scratch space — edge cases, examples, ideas:\n\nEdge cases:\n• \n• \n\nExamples:\n• ' },
];

export default function NotebookPanel({ question, onSendToAI, isThinking }) {
    const [activeTab, setActiveTab]  = useState('approach');
    const [content, setContent]      = useState({ approach: '', algorithm: '', pseudocode: '', notes: '' });
    const [history, setHistory]      = useState([]);
    const [expanded, setExpanded]    = useState(false); // question card toggle
    const textareaRef = useRef(null);

    const currentTab    = TABS.find(t => t.id === activeTab);
    const hasContent    = TABS.some(t => content[t.id].trim());

    const handleSend = () => {
        if (!hasContent || isThinking) return;
        const parts = TABS.filter(t => content[t.id].trim());
        const message = parts.length === 1
            ? `[${parts[0].label}]\n${content[parts[0].id]}`
            : parts.map(t => `[${t.label}]\n${content[t.id]}`).join('\n\n---\n\n');

        setHistory(prev => [...prev, { id: Date.now(), content: message, ts: new Date() }]);
        setContent({ approach: '', algorithm: '', pseudocode: '', notes: '' });
        onSendToAI?.(message);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0c11]"
            style={{ backgroundImage: 'radial-gradient(circle, #1e1e2e 1px, transparent 1px)', backgroundSize: '28px 28px' }}>

            {/* ── Question Card ─────────────────────────────────────────── */}
            {question ? (
                <div className="flex-shrink-0 m-4 mb-2 bg-[#13131c]/95 border border-indigo-500/20 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg shadow-indigo-500/5">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Question</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                question.difficulty === 'Easy'   ? 'bg-emerald-500/15 text-emerald-400' :
                                question.difficulty === 'Medium' ? 'bg-yellow-500/15  text-yellow-400'  :
                                                                   'bg-red-500/15     text-red-400'
                            }`}>{question.difficulty}</span>
                        </div>
                        <button onClick={() => setExpanded(x => !x)} className="text-gray-600 hover:text-gray-400 transition-colors text-xs">
                            {expanded ? '▲ less' : '▼ more'}
                        </button>
                    </div>
                    <div className="px-4 pb-3">
                        <h2 className="text-base font-bold text-white mb-1">{question.title}</h2>
                        <p className={`text-xs text-gray-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                            {question.description}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-shrink-0 m-4 mb-2 bg-[#13131c]/70 border border-white/[0.06] rounded-2xl p-4 text-center">
                    <p className="text-xs text-gray-600">Waiting for question from AI...</p>
                </div>
            )}

            {/* ── Sent History ──────────────────────────────────────────── */}
            {history.length > 0 && (
                <div className="flex-shrink-0 mx-4 mb-2 space-y-1.5 max-h-28 overflow-y-auto">
                    {history.map(e => (
                        <div key={e.id} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] text-emerald-500/50 font-semibold">✓ Sent to AI</span>
                                <span className="text-[10px] text-gray-700">{e.ts.toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-1 font-mono">{e.content}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tab Bar ───────────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center gap-1 px-4 pb-1">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                            activeTab === tab.id
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                        }`}>
                        <span>{tab.icon}</span>
                        {tab.label}
                        {content[tab.id].trim() && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 ml-0.5"/>}
                    </button>
                ))}
            </div>

            {/* ── Writing Area ──────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 px-4 pb-2">
                <div className="h-full bg-[#13131c]/80 border border-white/[0.06] rounded-2xl flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/[0.04]">
                        <span className="text-base">{currentTab?.icon}</span>
                        <span className="text-sm font-semibold text-white">{currentTab?.label}</span>
                        {content[activeTab].trim() && (
                            <span className="ml-auto text-[10px] text-gray-600">{content[activeTab].length} chars</span>
                        )}
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={content[activeTab]}
                        onChange={e => setContent(prev => ({ ...prev, [activeTab]: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        placeholder={currentTab?.placeholder}
                        className="flex-1 w-full bg-transparent px-5 py-4 text-sm text-gray-200 placeholder-gray-700/60 resize-none outline-none leading-7"
                        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}
                    />
                </div>
            </div>

            {/* ── Send Bar ─────────────────────────────────────────────── */}
            <div className="flex-shrink-0 px-4 pb-4 flex items-center gap-3">
                <button onClick={() => setContent({ approach: '', algorithm: '', pseudocode: '', notes: '' })}
                    disabled={!hasContent}
                    className="text-xs text-gray-600 hover:text-gray-400 font-medium px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors disabled:opacity-30">
                    Clear
                </button>
                <div className="flex-1"/>
                <span className="text-[10px] text-gray-600 hidden sm:block">Ctrl+Enter to send</span>
                <button onClick={handleSend} disabled={!hasContent || isThinking}
                    className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
                        !hasContent || isThinking
                            ? 'bg-white/[0.04] text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20'
                    }`}>
                    {isThinking ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                        </svg>
                    )}
                    {isThinking ? 'AI thinking...' : 'Send to AI'}
                </button>
            </div>
        </div>
    );
}
