import React from 'react';
import axios from 'axios';

export default function FeedbackForm({ roomId, role, onComplete, initialNotes }) {
    const [scores, setScores] = React.useState({ communication: 5, technical: 5, problemSolving: 5, overall: 5 });
    const [notes, setNotes] = React.useState(initialNotes || "");

    const handleSubmit = async () => {
        try {
            if (role === 'interviewer') {
                await axios.put(`http://localhost:5000/api/interviews/${roomId}/feedback`, {
                    scores,
                    interviewerNotes: notes,
                    status: 'Completed'
                });
            } else {
                await axios.put(`http://localhost:5000/api/interviews/${roomId}/feedback`, {
                    candidateFeedback: notes,
                    status: 'Completed'
                });
            }
            alert('Feedback saved successfully! You can close this window now.');
            if(onComplete) onComplete();
        } catch(e) {
            alert('Failed to save feedback: ' + (e.response?.data?.msg || e.message));
        }
    };

    if (role === 'interviewer') {
        return (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-[#15151a] border border-white/[0.05] p-8 rounded-2xl w-full max-w-lg shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-2">Interview Concluded</h2>
                    <p className="text-sm text-gray-500 mb-6">Please provide your final assessments and scores for this candidate.</p>

                    <div className="space-y-4 mb-6">
                        {Object.entries(scores).map(([key, value]) => (
                            <div key={key}>
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="text-indigo-400">{value}/10</span>
                                </div>
                                <input 
                                    type="range" min="1" max="10" value={value} 
                                    onChange={(e) => setScores({...scores, [key]: parseInt(e.target.value)})}
                                    className="w-full accent-indigo-500 bg-white/[0.05] rounded-full h-2 appearance-none"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Final Evaluative Notes</label>
                        <textarea 
                            rows="4" 
                            className="w-full bg-black/50 border border-white/[0.1] rounded-xl p-3 text-sm text-white resize-none outline-none focus:border-indigo-500"
                            placeholder="Summarize candidate's strengths and weaknesses..."
                            value={notes} onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <button onClick={handleSubmit} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-bold transition hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5">
                        Submit Evaluation
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#15151a] border border-white/[0.05] p-8 rounded-2xl w-full max-w-md shadow-2xl text-center">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Interview Completed</h2>
                <p className="text-sm text-gray-500 mb-6">Thank you for your time. How was your experience today?</p>

                <textarea 
                    rows="3" 
                    className="w-full bg-black/50 border border-white/[0.1] rounded-xl p-3 text-sm text-white resize-none outline-none focus:border-indigo-500 mb-6"
                    placeholder="Tell us about the interview process..."
                    value={notes} onChange={e => setNotes(e.target.value)}
                />

                <button onClick={handleSubmit} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold transition hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5">
                    Submit Feedback
                </button>
            </div>
        </div>
    );
}
