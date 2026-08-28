import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ApplicantProfileModal({ applicant, onClose }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (applicant?._id) {
        axios.get(`http://localhost:5000/api/interviews/application/${applicant._id}`)
            .then(res => setHistory(res.data))
            .catch(err => console.error("Failed to fetch interview history:", err))
            .finally(() => setLoadingHistory(false));
    }
  }, [applicant]);

  if (!applicant) return null;
  const candidate = applicant.candidateId;

  const matchScore = applicant.matchScore || 0;
  const finalScore = applicant.oaScore || "Pending";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-[#12121a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/[0.08] animate-slideUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 flex justify-between items-center text-white">
            <div>
                <h2 className="text-2xl font-bold">{candidate?.name || "Unknown Candidate"}</h2>
                <p className="text-indigo-200 text-sm">{candidate?.instituteName || "College Not Specified"}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white bg-white/10 rounded-xl w-10 h-10 flex items-center justify-center font-bold text-xl transition hover:bg-white/20">&times;</button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">Technical Skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {(candidate?.skills || []).length > 0 ? candidate.skills.map(skill => (
                            <span key={skill} className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-lg text-xs font-semibold border border-indigo-500/20">{skill}</span>
                        )) : <span className="text-gray-600 text-sm">No skills listed.</span>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                     <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.06]">
                         <span className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">Experience</span>
                         <span className="text-lg font-bold text-white">{candidate?.experience || 0} Yrs</span>
                     </div>
                     <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.06]">
                         <span className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">CGPA</span>
                         <span className="text-lg font-bold text-white">{candidate?.cgpa || "N/A"}</span>
                     </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">Social Profiles</h3>
                    <div className="flex gap-3">
                        {candidate?.linkedin && <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="text-indigo-400 font-medium text-sm hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          LinkedIn
                        </a>}
                        {candidate?.github && <a href={candidate.github} target="_blank" rel="noreferrer" className="text-gray-400 font-medium text-sm hover:text-gray-300 transition-colors flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          GitHub
                        </a>}
                    </div>
                </div>
            </div>

            {/* Right Column: Scoring */}
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-6 rounded-2xl border border-indigo-500/15">
                    <h3 className="text-white font-bold mb-4 border-b border-white/[0.06] pb-2 text-sm">Score Breakdown</h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-400">Resume Match</span>
                            <span className="font-bold text-indigo-300 text-lg">{matchScore}%</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                            <span className="text-sm font-bold text-white">Proctored OA Score</span>
                            <span className="font-bold text-indigo-300 text-xl">{finalScore}{finalScore !== "Pending" && "%"}</span>
                        </div>
                    </div>
                </div>

                <a href={`http://localhost:5000/${applicant.resumePath}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    View Resume PDF
                </a>
                
                <p className="text-center text-xs text-gray-600">Use this overview to finalize your decision.</p>
            </div>
        </div>

        {/* Interview History Section */}
        <div className="p-8 border-t border-white/[0.06] bg-black/20">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.1em] mb-6 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Interview History
            </h3>

            {loadingHistory ? (
                <div className="text-center text-gray-500 text-sm py-8 animate-pulse">Loading interview timeline...</div>
            ) : history.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8 border border-dashed border-white/[0.1] rounded-2xl">No interviews recorded yet.</div>
            ) : (
                <div className="space-y-4">
                    {history.map((inv, idx) => (
                        <div key={inv._id || idx} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.03] transition">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${inv.interviewMode === 'AI' ? 'bg-violet-500/20 text-violet-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                            {inv.interviewMode} Round
                                        </span>
                                        <h4 className="text-white font-bold">{inv.stageName}</h4>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {new Date(inv.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        {inv.interviewerId && ` • Interviewer: ${inv.interviewerId.name}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                                        inv.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                        inv.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                        {inv.status}
                                    </span>
                                </div>
                            </div>

                            {inv.status === 'Completed' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-white/[0.06]">
                                    {/* Scores */}
                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-bold text-gray-500 uppercase">Score Breakdown</h5>
                                        {inv.interviewMode === 'AI' && inv.aiDetails ? (
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-black/30 p-2 rounded-lg flex justify-between">
                                                    <span className="text-gray-400">Code Quality</span>
                                                    <span className="text-indigo-300 font-bold">{inv.aiDetails.scores?.codeQuality || 0}%</span>
                                                </div>
                                                <div className="bg-black/30 p-2 rounded-lg flex justify-between">
                                                    <span className="text-gray-400">Communication</span>
                                                    <span className="text-indigo-300 font-bold">{inv.aiDetails.scores?.communication || 0}%</span>
                                                </div>
                                                <div className="bg-black/30 p-2 rounded-lg flex justify-between">
                                                    <span className="text-gray-400">Code Correctness</span>
                                                    <span className="text-indigo-300 font-bold">{inv.aiDetails.scores?.codeCorrectness || 0}%</span>
                                                </div>
                                                <div className="bg-black/30 p-2 rounded-lg flex justify-between border border-indigo-500/20">
                                                    <span className="text-gray-400">Overall</span>
                                                    <span className="text-indigo-400 font-bold">{inv.aiDetails.scores?.overall || 0}%</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-black/30 p-2 rounded-lg flex justify-between">
                                                    <span className="text-gray-400">Technical</span>
                                                    <span className="text-indigo-300 font-bold">{inv.scores?.technical || 0}/10</span>
                                                </div>
                                                <div className="bg-black/30 p-2 rounded-lg flex justify-between">
                                                    <span className="text-gray-400">Communication</span>
                                                    <span className="text-indigo-300 font-bold">{inv.scores?.communication || 0}/10</span>
                                                </div>
                                                <div className="bg-black/30 p-2 rounded-lg flex justify-between">
                                                    <span className="text-gray-400">Problem Solving</span>
                                                    <span className="text-indigo-300 font-bold">{inv.scores?.problemSolving || 0}/10</span>
                                                </div>
                                                <div className="bg-black/30 p-2 rounded-lg flex justify-between border border-indigo-500/20">
                                                    <span className="text-gray-400">Overall</span>
                                                    <span className="text-indigo-400 font-bold">{inv.scores?.overall || 0}/10</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Feedback */}
                                    <div className="space-y-3">
                                        {inv.interviewMode === 'AI' && inv.aiDetails?.aiSummary && (
                                            <div>
                                                <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">AI Evaluation Summary</h5>
                                                <div className="text-xs text-gray-300 leading-relaxed bg-black/30 p-3 rounded-lg border border-white/[0.04]">
                                                    {inv.aiDetails.aiSummary}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {inv.interviewMode === 'Human' && (
                                            <>
                                                {inv.interviewerNotes && (
                                                    <div>
                                                        <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Interviewer Notes</h5>
                                                        <div className="text-xs text-gray-300 leading-relaxed bg-black/30 p-3 rounded-lg border border-white/[0.04]">
                                                            {inv.interviewerNotes}
                                                        </div>
                                                    </div>
                                                )}
                                                {inv.candidateFeedback && (
                                                    <div>
                                                        <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Candidate Feedback</h5>
                                                        <div className="text-xs text-gray-400 italic bg-black/30 p-3 rounded-lg border border-white/[0.04]">
                                                            "{inv.candidateFeedback}"
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
