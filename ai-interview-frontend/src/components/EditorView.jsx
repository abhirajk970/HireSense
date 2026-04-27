import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

const AI_SERVER = "http://localhost:5200";

export default function EditorView({ code, language, onCodeChange, onLanguageChange, roomId }) {
    const [output, setOutput]         = useState("");
    const [isRunning, setIsRunning]   = useState(false);
    const [testResults, setTestResults] = useState(null); // { passed, total, errors }

    // ── Run against DSA test cases via interview engine ───────────────────────
    const runAgainstTests = async () => {
        if (!roomId) {
            setOutput("⚠ No roomId provided — cannot run against test cases.");
            return;
        }
        setIsRunning(true);
        setOutput("⏳ Running against test cases...");
        setTestResults(null);

        try {
            const res = await axios.post(`${AI_SERVER}/api/dsa/run-code`, {
                roomId,
                code,
                language
            });

            const { testResults: tr, message } = res.data;
            setTestResults(tr);

            const lines = [];
            lines.push(`✅ Passed: ${tr.passed} / ${tr.total}`);
            if (tr.errors && tr.errors.length > 0) {
                lines.push("");
                lines.push("❌ Failures:");
                tr.errors.forEach(e => lines.push(`  • ${e}`));
            }
            lines.push(`\n⏱  ${tr.timeTaken}ms`);
            setOutput(lines.join("\n"));

        } catch (err) {
            setOutput(`Execution error: ${err.response?.data?.error || err.message}`);
        }
        setIsRunning(false);
    };

    // ── Result bar colour ─────────────────────────────────────────────────────
    const resultColor = () => {
        if (!testResults) return "";
        if (testResults.passed === testResults.total) return "text-emerald-400";
        if (testResults.passed > 0) return "text-yellow-400";
        return "text-red-400";
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
            {/* Top Bar */}
            <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-b border-[#3c3c3c]">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"/>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                    <div className="w-3 h-3 rounded-full bg-green-500"/>
                    <span className="ml-3 text-xs font-semibold text-gray-400">Code Editor</span>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value)}
                        className="bg-[#3c3c3c] text-white text-xs font-semibold px-2 py-1 rounded outline-none"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                    </select>

                    {/* Test case runner */}
                    <button
                        onClick={runAgainstTests}
                        disabled={isRunning}
                        className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded transition-all ${
                            isRunning
                                ? "bg-emerald-800/50 text-gray-400 cursor-wait"
                                : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                        }`}
                    >
                        {isRunning ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                            </svg>
                        )}
                        {isRunning ? "Running..." : "Run Tests"}
                    </button>
                </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
                <Editor
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => onCodeChange(val || "")}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true
                    }}
                />
            </div>

            {/* Output / Test Results Panel */}
            <div className="h-40 bg-[#0d0d12] border-t border-[#3c3c3c] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05]">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        Test Results
                    </span>

                    {/* Inline pass/fail badge */}
                    {testResults && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            testResults.passed === testResults.total
                                ? "bg-emerald-500/20 text-emerald-400"
                                : testResults.passed > 0
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                        }`}>
                            {testResults.passed}/{testResults.total} passed
                        </span>
                    )}

                    {output && (
                        <button onClick={() => { setOutput(""); setTestResults(null); }} className="text-[10px] text-gray-600 hover:text-gray-400 font-bold">
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-2">
                    <pre className={`text-xs font-mono whitespace-pre-wrap ${resultColor() || (output.includes("⚠") || output.toLowerCase().includes("error") ? "text-red-400" : "text-emerald-400")}`}>
                        {output || <span className="text-gray-600 italic">Click "Run Tests" to evaluate your code against test cases...</span>}
                    </pre>
                </div>
            </div>
        </div>
    );
}
