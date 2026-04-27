import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

function JobApplication() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const candidateId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, profileRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/jobs/${jobId}`),
            axios.get(`http://localhost:5000/api/profile/${candidateId}`)
        ]);
        setJob(jobRes.data);
        setProfile(profileRes.data);
      } catch (err) {
        setError("Could not load job or profile details.");
      }
    };
    fetchData();
  }, [jobId, candidateId]);

  const submitApplication = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("candidateId", candidateId);
      formData.append("jobId", jobId);
      if (file) {
        formData.append("resume", file);
      }

      const res = await axios.post("http://localhost:5000/api/applications/apply", formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  if (!job && !error) return <DashboardLayout><div className="flex justify-center p-10"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/candidate')} className="mb-6 flex items-center text-gray-500 hover:text-gray-300 transition-colors text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Dashboard
        </button>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}

        {job && !result && (
          <div className="bg-white/[0.03] p-8 rounded-2xl border border-white/[0.06] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-bl-full" />
            
            <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
            <p className="text-lg text-indigo-400 font-medium mb-6">{job.createdBy?.companyName}</p>
            
            <div className="flex flex-wrap gap-3 mb-8">
                {[job.location, job.jobType, `${job.experienceRequired}+ Years`, job.salaryRange].filter(Boolean).map((tag, i) => (
                  <span key={i} className="bg-white/[0.04] text-gray-400 px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.06]">{tag}</span>
                ))}
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Job Description</h3>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-lg text-sm font-semibold border border-indigo-500/20">{skill}</span>
                    ))}
                </div>
            </div>

            <div className="border-t border-white/[0.06] pt-8">
                <form onSubmit={submitApplication} className="bg-white/[0.02] p-6 rounded-xl border border-white/[0.06]">
                    <h3 className="text-lg font-bold text-white mb-2">Submit Your Application</h3>
                    <p className="text-gray-500 mb-6 text-sm">Upload your latest resume. Our AI will analyze it to calculate your match score.</p>

                    <div className="mb-6">
                         <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Resume (PDF)</label>
                         <input 
                            type="file" 
                            accept="application/pdf" 
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-300 hover:file:bg-indigo-500/20 transition-colors bg-white/[0.04] border border-white/[0.08] rounded-xl"
                            onChange={(e) => setFile(e.target.files[0])}
                         />
                         {profile?.resumeUrl ? (
                             <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center">
                                 <svg className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                 <p className="text-sm text-emerald-300 font-medium">Resume saved in your profile. Leave blank to use it automatically.</p>
                             </div>
                         ) : (
                            <p className="text-xs text-gray-600 mt-2">Uploading a resume is required for new applications.</p>
                         )}
                    </div>

                    <button 
                      disabled={loading}
                      type="submit" 
                      className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${loading ? 'bg-indigo-500/40 cursor-wait' : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-indigo-500/25 hover:-translate-y-0.5'}`}
                    >
                      {loading ? 'Analyzing Application with AI...' : 'Submit Application'}
                    </button>
                </form>
            </div>
          </div>
        )}

        {result && (
            <div className="bg-white/[0.03] p-10 rounded-2xl border border-white/[0.06] text-center">
                 <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                 </div>
                 <h2 className="text-3xl font-bold text-white mb-2">Application Submitted!</h2>
                 <p className="text-gray-500 mb-8">Your profile has been analyzed against the job requirements.</p>

                 <div className="bg-white/[0.04] rounded-2xl p-8 mb-8 max-w-sm mx-auto border border-white/[0.08]">
                     <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500 mb-3">AI Match Score</p>
                     <div className="flex justify-center items-end mb-4">
                        <span className="text-6xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{result.matchScore}</span>
                        <span className="text-2xl font-bold text-gray-600 mb-1 ml-1">%</span>
                     </div>
                     <div className="w-full bg-white/[0.06] rounded-full h-2 mb-6">
                        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${result.matchScore}%` }}></div>
                     </div>
                     <div>
                         <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Matched Skills</p>
                         <div className="flex flex-wrap gap-1.5 justify-center">
                            {result.matchedSkills.length > 0 ? result.matchedSkills.map((s,i) => <span key={i} className="bg-emerald-500/10 text-emerald-300 text-xs px-2.5 py-1 rounded-lg font-semibold border border-emerald-500/20">{s}</span>) : <span className="text-gray-600 text-sm">None</span>}
                         </div>
                     </div>
                 </div>

                 <div className="flex gap-3 justify-center">
                     <button onClick={() => navigate('/candidate')} className="px-6 py-3 rounded-xl border border-white/[0.1] text-gray-300 font-semibold hover:bg-white/[0.04] transition-colors">Return to Dashboard</button>
                     <button onClick={() => navigate(`/test/mock/application/${result.application._id}`)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all">Take Assessment</button>
                 </div>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default JobApplication;
