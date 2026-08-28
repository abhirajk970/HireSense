import { useState } from "react";
import axios from "axios";

export default function AssignmentSubmissionModal({ application, onClose, onSuccess }) {
  const [repoLink, setRepoLink] = useState("");
  const [liveLink, setLiveLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!application) return null;

  // Find the active assignment stage
  const job = application.jobId;
  const assignmentStage = job?.stages?.find(s => s.name === "Assignment" && new Date(s.startDate) <= new Date() && (!s.endDate || new Date(s.endDate) >= new Date()));
  const assignment = assignmentStage?.assignment;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoLink) {
        setError("Repository link is required.");
        return;
    }
    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/applications/${application._id}/assignment`, {
        repoLink,
        liveLink
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || "Submission failed");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-[#12121a] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/[0.08] animate-slideUp">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-bold">Assignment Submission</h2>
            <p className="text-indigo-200 text-sm mt-1">{job?.title || "Job Application"}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white bg-white/10 rounded-xl w-9 h-9 flex items-center justify-center font-bold text-xl transition hover:bg-white/20">&times;</button>
        </div>

        <div className="p-8">
            {assignment ? (
                <div className="mb-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                    <h3 className="font-bold text-white mb-2">{assignment.title || "Assignment Details"}</h3>
                    <p className="text-sm text-gray-400 mb-4 whitespace-pre-wrap">{assignment.description || "No description provided."}</p>
                    {assignment.pdfUrl && (
                        <a href={assignment.pdfUrl.startsWith('http') ? assignment.pdfUrl : `http://localhost:5000/${assignment.pdfUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            View Assignment PDF
                        </a>
                    )}
                </div>
            ) : (
                <div className="mb-6 text-sm text-amber-400 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                    No active assignment found for this stage.
                </div>
            )}

            {application.assignmentSubmission?.submittedAt ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <h3 className="font-bold text-emerald-400 mb-1">Assignment Submitted</h3>
                    <p className="text-xs text-emerald-500/80 mb-4">Submitted on {new Date(application.assignmentSubmission.submittedAt).toLocaleString('en-IN')}</p>
                    <div className="flex justify-center gap-4 text-sm font-medium">
                        <a href={application.assignmentSubmission.repoLink} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">View Repository</a>
                        {application.assignmentSubmission.liveLink && (
                            <a href={application.assignmentSubmission.liveLink} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">View Live URL</a>
                        )}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</div>}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">GitHub / Repository Link <span className="text-red-400">*</span></label>
                        <input type="url" required value={repoLink} onChange={e => setRepoLink(e.target.value)} placeholder="https://github.com/..." className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Live Demo Link (Optional)</label>
                        <input type="url" value={liveLink} onChange={e => setLiveLink(e.target.value)} placeholder="https://..." className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <button type="submit" disabled={loading || !assignment} className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? "Submitting..." : "Submit Assignment"}
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}
