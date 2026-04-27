import React, { useState } from 'react';
import axios from 'axios';
import ApplicantProfileModal from './ApplicantProfileModal';

export default function JobApplicantsManager({ job, applicants, onBack, handleScheduleOA, fetchDashboardData }) {
    const [viewMode, setViewMode] = useState('card');
    const [processStatus, setProcessStatus] = useState(job.processStatus || "Active");
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    
    // Scheduling Modal State
    const [candidateToSchedule, setCandidateToSchedule] = useState(null);
    const [scheduleDetails, setScheduleDetails] = useState({ stageName: "", scheduledAt: "" });

    const stopProcess = async () => {
        if(!window.confirm("Are you sure you want to stop this hiring process? No more progress will be made.")) return;
        try {
            await axios.put(`http://localhost:5000/api/jobs/${job._id}/stop-process`);
            setProcessStatus("Stopped");
            alert("Process halted successfully.");
            fetchDashboardData();
        } catch(err) {
            alert("Failed to stop process");
        }
    };

    const handleScheduleInterview = async () => {
        if (!scheduleDetails.stageName || !scheduleDetails.scheduledAt) {
            return alert("Please provide all scheduling details.");
        }

        // Derive interviewMode from the selected pipeline stage's interviewType
        const selectedStage = job.stages?.find(s => s.name === scheduleDetails.stageName);
        const interviewMode = selectedStage?.interviewType === 'AI' ? 'AI' : 'Human';
        
        try {
            await axios.post('http://localhost:5000/api/interviews/schedule', {
                jobId: job._id,
                applicationId: candidateToSchedule._id,
                interviewerId: job.createdBy || localStorage.getItem("userId"),
                candidateId: candidateToSchedule.candidateId._id,
                stageName: scheduleDetails.stageName,
                scheduledAt: scheduleDetails.scheduledAt,
                interviewMode
            });
            alert(`${interviewMode === 'AI' ? 'AI' : 'Human'} Interview successfully scheduled!`);
            setCandidateToSchedule(null);
            setScheduleDetails({ stageName: "", scheduledAt: "" });
        } catch (err) {
            alert("Failed to schedule interview: " + err.message);
        }
    };

    const formatDate = (d) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="rounded-2xl min-h-[500px]">
            {/* Header Toolbar */}
            <div className="bg-white/[0.03] p-4 border border-white/[0.06] flex flex-wrap justify-between items-center rounded-2xl mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-500 hover:text-indigo-300 bg-white/[0.04] hover:bg-indigo-500/10 w-10 h-10 rounded-xl flex items-center justify-center transition border border-white/[0.06]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white">{job.title} <span className="text-xs font-medium text-gray-500 bg-white/[0.06] px-3 py-1 rounded-lg ml-2 border border-white/[0.06]">{applicants.length} Applicants</span></h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white/[0.04] p-1 rounded-xl flex border border-white/[0.06]">
                        <button onClick={() => setViewMode('card')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition ${viewMode === 'card' ? 'bg-indigo-500/15 text-indigo-300 shadow' : 'text-gray-500 hover:text-gray-300'}`}>Cards</button>
                        <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition ${viewMode === 'table' ? 'bg-indigo-500/15 text-indigo-300 shadow' : 'text-gray-500 hover:text-gray-300'}`}>Table</button>
                    </div>

                    {processStatus === "Active" ? (
                        <button onClick={stopProcess} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 px-4 py-2 rounded-xl font-semibold text-sm transition">
                            Halt Process
                        </button>
                    ) : (
                        <span className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl font-semibold text-sm opacity-50 cursor-not-allowed border border-red-500/20">Process Stopped</span>
                    )}
                </div>
            </div>

            {/* Pipeline Config View */}
            <div className="bg-white/[0.03] p-5 mb-6 rounded-xl border border-white/[0.06]">
                <div className="mb-4">
                     <h3 className="font-bold text-white text-sm">Hiring Pipeline</h3>
                     <p className="text-xs text-gray-500">Current stages and evaluation rules. Edit configuration from the "Config" button in My Jobs tab.</p>
                </div>
                
                <div className="flex items-start gap-2 overflow-x-auto pb-4 custom-scrollbar">
                    {job.stages && job.stages.length > 0 ? job.stages.map((stage, idx) => (
                        <div key={idx} className="flex-shrink-0 flex items-center">
                            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 w-48 transition-all hover:bg-white/[0.06]">
                                <div className="flex items-center gap-2 mb-2">
                                     <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-[10px]">{idx + 1}</div>
                                     <h4 className="font-bold text-sm text-indigo-200 truncate">{stage.name}</h4>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-medium text-gray-400 flex justify-between">
                                        <span>Advance:</span> 
                                        <span className="text-indigo-400 font-bold">{stage.advanceMode === "Auto" ? `Auto (Top ${stage.advanceTopK})` : "Manual"}</span>
                                    </div>
                                    {stage.interviewType && stage.interviewType !== "None" && (
                                        <div className="text-[10px] font-medium text-gray-400 flex justify-between">
                                            <span>Type:</span> 
                                            <span className="text-emerald-400 font-bold">{stage.interviewType}</span>
                                        </div>
                                    )}
                                    {stage.startDate && (
                                        <div className="text-[10px] font-medium text-gray-500 mt-2 pt-2 border-t border-white/[0.06]">
                                            {formatDate(stage.startDate)} - {formatDate(stage.endDate)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {idx < job.stages.length - 1 && (
                                <svg className="w-4 h-4 mx-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            )}
                        </div>
                    )) : (
                        <div className="text-sm text-gray-500">No stages defined.</div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div>
                {applicants.length === 0 ? (
                    <div className="text-center p-12 bg-white/[0.03] rounded-xl border border-dashed border-white/[0.08] text-gray-500 font-medium">No candidates have applied for this opening yet.</div>
                ) : viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {applicants.map(app => (
                            <div key={app._id} onClick={() => setSelectedApplicant(app)} className="group bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 cursor-pointer hover:bg-white/[0.05] hover:border-white/[0.1] transition-all relative overflow-hidden hover:-translate-y-0.5">
                                <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition" />
                                <div className="flex justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">{app.candidateId?.name}</h3>
                                        <p className="text-xs text-gray-500">{app.candidateId?.instituteName || "College Unknown"}</p>
                                    </div>
                                    <div className={`font-bold w-12 h-12 flex items-center justify-center rounded-xl text-sm border ${app.matchScore >= 70 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'}`}>
                                        {app.matchScore}%
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/[0.06] flex-wrap gap-2">
                                    <span className="text-xs font-semibold bg-white/[0.06] text-gray-400 px-3 py-1 rounded-lg border border-white/[0.06]">{app.status}</span>
                                    <div className="flex gap-2">
                                        {app.oaStatus !== "Scheduled" && app.oaStatus !== "Completed" && (
                                            <button onClick={(e) => { e.stopPropagation(); handleScheduleOA(app._id); }} className="text-xs bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold px-3 py-1.5 rounded-lg border border-white/[0.1] transition">
                                                Assign OA
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setCandidateToSchedule(app); }} className="text-xs bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                                            Schedule Next Round
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="border-b border-white/[0.06]">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Match</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applicants.map(app => (
                                    <tr key={app._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setSelectedApplicant(app)}>
                                        <td className="p-4">
                                            <p className="font-medium text-white">{app.candidateId?.name}</p>
                                            <p className="text-xs text-gray-500">{app.candidateId?.instituteName}</p>
                                        </td>
                                        <td className="p-4 font-bold text-indigo-400">{app.matchScore}%</td>
                                        <td className="p-4">
                                            <span className="text-xs font-semibold bg-white/[0.06] text-gray-400 px-2.5 py-1 rounded-lg border border-white/[0.06]">{app.status}</span>
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            {app.oaStatus !== "Scheduled" && app.oaStatus !== "Completed" && (
                                                <button onClick={(e) => { e.stopPropagation(); handleScheduleOA(app._id); }} className="text-xs bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold px-3 py-1.5 rounded-lg border border-white/[0.1] transition">
                                                    Assign OA
                                                </button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); setCandidateToSchedule(app); }} className="text-xs bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                                                Schedule Round
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {selectedApplicant && (
                <ApplicantProfileModal applicant={selectedApplicant} onClose={() => setSelectedApplicant(null)} />
            )}

            {/* Schedule Modal */}
            {candidateToSchedule && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setCandidateToSchedule(null)}>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-2">Schedule Interview</h2>
                        <p className="text-sm text-gray-400 mb-6">Create a new interview/round block for <span className="text-indigo-400 font-bold">{candidateToSchedule.candidateId?.name}</span>.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Select Pipeline Stage</label>
                                <select 
                                    className="w-full bg-black/50 border border-white/[0.1] rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                    value={scheduleDetails.stageName}
                                    onChange={(e) => setScheduleDetails(prev => ({...prev, stageName: e.target.value}))}
                                >
                                    <option value="" disabled>Select a stage...</option>
                                    {job.stages && job.stages.map((st, i) => (
                                        <option key={i} value={st.name}>{st.name} {st.interviewType && st.interviewType !== "None" ? `(${st.interviewType})` : ""}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Date & Time</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full bg-black/50 border border-white/[0.1] rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                    value={scheduleDetails.scheduledAt}
                                    onChange={(e) => setScheduleDetails(prev => ({...prev, scheduledAt: e.target.value}))}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setCandidateToSchedule(null)} className="flex-1 py-2.5 rounded-xl font-semibold border border-white/[0.1] text-gray-400 transition-all hover:bg-white/[0.05]">Cancel</button>
                            <button onClick={handleScheduleInterview} className="flex-1 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">Send Invite</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
