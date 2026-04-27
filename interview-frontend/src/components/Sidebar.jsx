import React from "react";

export default function Sidebar({ notes, onNotesChange, onEndInterview }) {
    return (
        <div className="w-80 border-r border-white/[0.05] bg-[#0d0d12] flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-white/[0.05]">
                <h2 className="text-sm font-bold text-white mb-1">Interview Details</h2>
                <div className="text-xs text-gray-400">Technical Round • 60 mins</div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                 <div className="mb-6">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Question Set</h3>
                     <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                         <p className="text-sm text-gray-300 font-medium mb-1">Q1. Implement an LRU Cache</p>
                         <p className="text-xs text-gray-500 mb-3">Expected: O(1) get/put operations.</p>
                         
                         <p className="text-sm text-gray-300 font-medium mb-1">Q2. Binary Tree Maximum Path Sum</p>
                         <p className="text-xs text-gray-500">Solve without global variables.</p>
                     </div>
                 </div>

                 {/* Private Notes — controlled by parent so they carry to FeedbackForm */}
                 <div className="flex flex-col h-1/2">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        Private Notes
                        <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded ml-auto">Invisible to Candidate</span>
                     </h3>
                     <textarea 
                        className="flex-1 w-full bg-black/40 border border-white/[0.1] rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-indigo-500 transition-colors"
                        placeholder="Write down observations, code quality remarks..."
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                     ></textarea>
                 </div>
            </div>

            <div className="p-4 border-t border-white/[0.05]">
                <button onClick={onEndInterview} className="w-full py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all">
                    End Interview
                </button>
            </div>
        </div>
    );
}
