import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [profile, setProfile] = useState({});
  const [filters, setFilters] = useState({ search: "", location: "All", minimumRequiredExperience: "" });
  const [activeTab, setActiveTab] = useState("jobs");

  const navigate = useNavigate();
  const candidateId = localStorage.getItem("userId");

  const fetchInterviews = async () => {
       try {
           const res = await axios.get(`http://localhost:5000/api/interviews/candidate/${candidateId}`);
           setInterviews(res.data);
       } catch (err) {
           console.error(err);
       }
  };

  const fetchProfile = async () => {
       try {
           const res = await axios.get(`http://localhost:5000/api/applications/candidate/${candidateId}`);
           setApplications(res.data);
           if(res.data.length > 0 && res.data[0].candidateId) {
                setProfile(res.data[0].candidateId);
           }
       } catch (err) {
           console.error(err);
       }
  };

  const fetchJobs = async () => {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append("mode", "candidate");
        if (filters.search) queryParams.append("search", filters.search);
        if (filters.location !== "All") queryParams.append("location", filters.location);
        if (filters.minimumRequiredExperience) queryParams.append("minExperience", filters.minimumRequiredExperience);
        
        const res = await axios.get(`http://localhost:5000/api/jobs?${queryParams}`);
        setJobs(res.data);
    } catch (err) {
        console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchInterviews();
  }, []);

  useEffect(() => {
      fetchJobs();
      // eslint-disable-next-line
  }, [filters, profile]);

  const calculateMatch = (jobSkills) => {
      if(!profile.skills || profile.skills.length === 0) return null;
      if(!jobSkills || jobSkills.length === 0) return 100;
      const matched = jobSkills.filter(s => profile.skills.some(ps => ps.toLowerCase() === s.toLowerCase()));
      return Math.round((matched.length / jobSkills.length) * 100);
  };

  const sortedJobs = [...jobs].sort((a, b) => {
      const matchA = calculateMatch(a.requiredSkills) || 0;
      const matchB = calculateMatch(b.requiredSkills) || 0;
      return matchB - matchA;
  });

  const checkSalaryMatch = (jobRangeStr, expectedSalary) => {
      if (!expectedSalary || !jobRangeStr) return false;
      const numericMatches = jobRangeStr.match(/\d+/g);
      if (numericMatches) {
          const maxSalary = Math.max(...numericMatches.map(n => parseInt(n)* (n.length <= 3 ? 1000 : 1)));
          if (maxSalary >= expectedSalary) return true;
      }
      return false;
  };

  const tabs = [
    { id: "jobs", label: "Find Jobs", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { id: "applications", label: "My Applications", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "assessments", label: "Assessments", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold t-text">Dashboard</h1>
          <p className="text-sm t-text-muted mt-1">Find opportunities tailored to your skills</p>
        </div>
        <div className="flex rounded-xl p-1 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <button onClick={() => setActiveTab("jobs")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'jobs' ? 'bg-violet-500/15 text-violet-400 shadow-lg shadow-violet-500/5' : 't-text-muted hover:t-text'}`}>
                Job Feed
            </button>
            <button onClick={() => setActiveTab("applied")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'applied' ? 'bg-violet-500/15 text-violet-400 shadow-lg shadow-violet-500/5' : 't-text-muted hover:t-text'}`}>
                My Applications
            </button>
            <button onClick={() => setActiveTab("assessments")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'assessments' ? 'bg-violet-500/15 text-violet-400 shadow-lg shadow-violet-500/5' : 't-text-muted hover:t-text'}`}>
                Assessments
            </button>
            <button onClick={() => setActiveTab("interviews")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'interviews' ? 'bg-violet-500/15 text-violet-400 shadow-lg shadow-violet-500/5' : 't-text-muted hover:t-text'}`}>
                Interviews {interviews.length > 0 && <span className="ml-1 bg-violet-500/20 text-violet-400 py-0.5 px-2 rounded-full text-[10px]">{interviews.length}</span>}
            </button>
        </div>
      </div>

      {activeTab === "jobs" && (
          <>
            {/* Filters */}
            <div className="rounded-2xl border p-5 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold t-text-muted mb-1.5 uppercase tracking-wider">Search Keywords</label>
                    <div className="relative">
                        <svg className="w-5 h-5 absolute left-3 top-3 t-text-dimmed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input className="w-full border pl-10 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} placeholder="Search by title, skills..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
                    </div>
                </div>
                <div>
                     <label className="block text-xs font-semibold t-text-muted mb-1.5 uppercase tracking-wider">Location</label>
                     <select className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }} value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})}>
                          <option>All</option>
                          <option>Remote</option>
                          <option>New York</option>
                          <option>San Francisco</option>
                     </select>
                </div>
                <div>
                     <label className="block text-xs font-semibold t-text-muted mb-1.5 uppercase tracking-wider">Max Experience</label>
                     <input type="number" className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} placeholder="e.g. 5" value={filters.minimumRequiredExperience} onChange={e => setFilters({...filters, minimumRequiredExperience: e.target.value})} />
                </div>
            </div>

            {/* Job Listings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {sortedJobs.length === 0 ? (
                  <div className="col-span-2 text-center py-16 text-gray-600">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    No jobs found matching your criteria.
                  </div>
              ) : sortedJobs.map(job => {
                  const hasApplied = applications.some(app => app.jobId?._id === job._id);
                  const match = calculateMatch(job.requiredSkills);
                  const deadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
                  const now = new Date();
                  const isPastDeadline = deadline && deadline < now;
                  const isClosingSoon = deadline && !isPastDeadline && (deadline - now) < (2 * 24 * 60 * 60 * 1000);

                  return (
                      <div key={job._id} className="group rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-0.5 t-card t-card-hover">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold t-text group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                                <p className="text-sm text-indigo-400 font-medium">{job.createdBy?.companyName || "Company Name Hidden"}</p>
                            </div>
                            {match !== null && (
                                <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border ${match >= 70 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : match >= 40 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-gray-500/10 border-gray-500/20 text-gray-400'}`}>
                                    <span className="text-lg font-bold leading-tight">{match}%</span>
                                    <span className="text-[9px] uppercase font-bold tracking-wider">Match</span>
                                </div>
                            )}
                        </div>
                        
                        <p className="t-text-muted mb-4 line-clamp-2 text-sm leading-relaxed">{job.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                            {job.requiredSkills.slice(0, 4).map((s, i) => (
                                <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg border t-card" style={{ color: 'var(--text-muted)' }}>{s}</span>
                            ))}
                            {job.requiredSkills.length > 4 && <span className="px-2.5 py-1 text-xs font-medium rounded-lg border t-card t-text-dimmed">+{job.requiredSkills.length - 4}</span>}
                        </div>

                        <div className="flex items-center justify-between border-t pt-4 mt-auto" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex gap-4 text-xs text-gray-500 font-medium">
                                    <span className="flex items-center"><svg className="w-3.5 h-3.5 mr-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> {job.location}</span>
                                    <span className="flex items-center"><svg className="w-3.5 h-3.5 mr-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> {job.experienceRequired}+ Yrs</span>
                                </div>
                                {deadline && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center border w-max ${isClosingSoon ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                       {isClosingSoon ? '⚠ Closing soon · ' : '📅 Apply by '}
                                       {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                                {checkSalaryMatch(job.salaryRange, profile.expectedSalary) && (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 w-max px-2 py-0.5 rounded-md flex items-center border border-emerald-500/20">
                                       ✓ Matches Salary
                                    </span>
                                )}
                            </div>
                            {hasApplied ? (
                                <span className="font-semibold px-4 py-2 rounded-xl text-sm border t-card t-text-muted">Applied ✓</span>
                            ) : isPastDeadline ? (
                                <span className="font-semibold px-4 py-2 rounded-xl text-sm border border-red-500/20 text-red-400 bg-red-500/5">Closed</span>
                            ) : (
                                <button onClick={() => navigate(`/apply/${job._id}`)} className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/20 text-white font-semibold px-5 py-2 rounded-xl shadow transition-all text-sm hover:-translate-y-0.5">Apply Now</button>
                            )}
                        </div>
                      </div>
                  );
              })}
            </div>
          </>
      )}

      {activeTab === "applications" && (
           <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
           <table className="w-full text-left">
              <thead className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <tr>
                      <th className="p-4 font-semibold t-text-muted text-xs uppercase tracking-wider">Job Title</th>
                      <th className="p-4 font-semibold t-text-muted text-xs uppercase tracking-wider">Company</th>
                      <th className="p-4 font-semibold t-text-muted text-xs uppercase tracking-wider">Match Score</th>
                      <th className="p-4 font-semibold t-text-muted text-xs uppercase tracking-wider">Status</th>
                      <th className="p-4 font-semibold t-text-muted text-xs uppercase tracking-wider">Action</th>
                  </tr>
              </thead>
              <tbody>
                  {applications.length === 0 ? (
                      <tr><td colSpan="5" className="p-12 text-center t-text-dimmed">You haven't applied to any jobs yet.</td></tr>
                  ) : applications.map(app => (
                       <tr key={app._id} className="border-b hover:bg-black/5 transition-colors" style={{ borderColor: 'var(--border)' }}>
                           <td className="p-4 font-medium t-text">{app.jobId?.title || "Unknown Job"}</td>
                           <td className="p-4 t-text-muted">{app.jobId?.location || "Remote"}</td>
                           <td className="p-4">
                               <span className="font-bold text-indigo-400">{app.matchScore}%</span>
                           </td>
                           <td className="p-4">
                               <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                   app.status === 'Applied' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 
                                   app.status === 'Testing' ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' :
                                   app.status === 'Interview' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06]'}`}>
                                   {app.status}
                               </span>
                           </td>
                           <td className="p-4">
                              <button onClick={() => navigate(`/test/mock/application/${app._id}`)} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Take MCQ →</button>
                           </td>
                       </tr>
                   ))}
               </tbody>
            </table>
         </div>
      )}

      {activeTab === "assessments" && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
           <table className="w-full text-left">
              <thead className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <tr>
                      <th className="p-4 font-semibold t-text-muted text-xs uppercase tracking-wider">Job Title</th>
                      <th className="p-4 font-semibold t-text-muted text-xs uppercase tracking-wider">Location</th>
                      <th className="p-4 font-semibold t-text-muted text-xs uppercase tracking-wider">Assessment Window</th>
                      <th className="p-4 font-semibold t-text-muted text-xs uppercase tracking-wider">Action</th>
                  </tr>
              </thead>
              <tbody>
                  {applications.filter(app => app.oaStatus === "Scheduled").length === 0 ? (
                      <tr><td colSpan="4" className="p-12 text-center text-gray-600">You have no pending assessments.</td></tr>
                  ) : applications.filter(app => app.oaStatus === "Scheduled").map(app => {
                      const now = new Date();
                      const start = new Date(app.oaWindowStart);
                      const end = new Date(app.oaWindowEnd);
                      const inWindow = now >= start && now <= end;
                      const hasPassed = now > end;

                      return (
                          <tr key={app._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                              <td className="p-4 font-medium text-white">{app.jobId?.title || "Unknown Job"}</td>
                              <td className="p-4 text-gray-400">{app.jobId?.location || "Remote"}</td>
                              <td className="p-4">
                                  <div className="text-xs font-semibold text-indigo-300">{start.toLocaleString()}</div>
                                  <div className="text-[10px] text-gray-600 my-0.5">to</div>
                                  <div className="text-xs font-semibold text-violet-300">{end.toLocaleString()}</div>
                              </td>
                              <td className="p-4">
                                  {inWindow ? (
                                      <a href={`http://localhost:5174/assessment/${app._id}/${app.candidateId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-cyan-600 px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 uppercase tracking-wider text-xs">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"/>
                                        Start OA
                                      </a>
                                  ) : hasPassed ? (
                                      <span className="text-sm font-bold text-red-400">Window Expired</span>
                                  ) : (
                                      <span className="text-sm font-medium text-gray-500">Starts Later</span>
                                  )}
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
           </table>
        </div>
      )}

      {/* ═══ ASSESSMENTS TAB ═══ */}
      {activeTab === "assessments" && (
          <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4 t-text">My Scheduled Assessments</h2>
              {applications.filter(app => app.oaStatus).length === 0 ? (
                  <div className="text-center p-12 bg-white/[0.03] rounded-xl border border-dashed border-white/[0.08] text-gray-500 font-medium">No active online assessments.</div>
              ) : (
                  <div className="grid grid-cols-1 gap-5">
                      {applications.filter(app => app.oaStatus).map(app => {
                          const now = new Date().getTime();
                          const start = app.oaWindowStart ? new Date(app.oaWindowStart).getTime() : 0;
                          const end = app.oaWindowEnd ? new Date(app.oaWindowEnd).getTime() : Infinity;
                          const isJoinable = now >= start && now <= end && app.oaStatus === 'Scheduled';

                          return (
                              <div key={app._id} className="rounded-2xl border p-5 flex flex-col justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <h3 className="font-bold text-lg t-text">Online Assessment</h3>
                                          <p className="text-sm font-medium text-indigo-400">{app.jobId?.title}</p>
                                          {app.oaWindowStart && <p className="text-xs text-gray-400 mt-2">Active Window: {new Date(app.oaWindowStart).toLocaleString()} - {new Date(app.oaWindowEnd).toLocaleString()}</p>}
                                      </div>
                                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${app.oaStatus === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>{app.oaStatus}</span>
                                  </div>

                                  <div className="flex items-center justify-between mt-6 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                      {app.oaStatus === 'Scheduled' && (
                                          <button 
                                              disabled={!isJoinable}
                                              onClick={() => window.open(`http://localhost:5174/assessment/${app._id}/${candidateId}`, '_blank')}
                                              className={`px-4 py-2 w-full rounded-xl text-sm font-bold transition-all ${isJoinable ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/[0.05] text-gray-500 cursor-not-allowed'}`}
                                          >
                                              {isJoinable ? 'Start Assessment' : 'Window Inactive'}
                                          </button>
                                      )}
                                      {app.oaStatus === 'Completed' && (
                                          <div className="w-full text-center text-sm font-bold text-gray-400 py-2">Assessment Confirmed</div>
                                      )}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              )}
        </div>
      )}

      {/* ═══ INTERVIEWS TAB ═══ */}
      {activeTab === "interviews" && (
          <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4 t-text">Upcoming Interviews</h2>
              {interviews.length === 0 ? (
                  <div className="text-center p-12 bg-white/[0.03] rounded-xl border border-dashed border-white/[0.08] text-gray-500 font-medium">No interviews scheduled yet.</div>
              ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {interviews.map(inv => {
                          const now = new Date().getTime();
                          const scheduled = new Date(inv.scheduledAt).getTime();
                          const isJoinable = scheduled - now <= 5 * 60000;
                          const isExpired = now > scheduled + 60 * 60000; // 1 hour past
                          const canJoin = isJoinable && !isExpired;
                          
                          return (
                              <div key={inv._id} className="rounded-2xl border p-5 flex flex-col justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                                  <div className="flex justify-between items-start mb-4">
                                      <div>
                                          <h3 className="font-bold text-lg t-text">{inv.stageName}</h3>
                                          <p className="text-xs text-indigo-400 font-medium">{inv.jobId?.title}</p>
                                          <p className="text-xs text-gray-500 mt-1">{inv.interviewMode === 'AI' ? '🤖 AI Interviewer' : `Interviewer: ${inv.interviewerId?.companyName || 'Company Representative'}`}</p>
                                      </div>
                                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${inv.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>{inv.status}</span>
                                  </div>

                                  <div className="flex items-center justify-between mt-auto border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                      <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                          {new Date(inv.scheduledAt).toLocaleString()}
                                      </div>
                                      
                                      {inv.status === 'Scheduled' && (
                                          <button 
                                              disabled={!canJoin && !isExpired}
                                              onClick={() => {
                                                  if(isExpired) {
                                                      alert('This interview has unfortunately expired as it is past the 1-hour active window limit.');
                                                  } else if (inv.interviewMode === 'AI') {
                                                      const params = new URLSearchParams({ jobTitle: inv.jobId?.title || '', stage: inv.stageName, candidateId: localStorage.getItem('userId') || '' });
                                                      window.open(`http://localhost:5179/room/${inv.roomId}?${params.toString()}`, '_blank');
                                                  } else {
                                                      window.open(`http://localhost:5178/room/${inv.roomId}?role=candidate`, '_blank');
                                                  }
                                              }}
                                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                  canJoin ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                                  : isExpired ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                  : 'bg-white/[0.05] text-gray-500 cursor-not-allowed'
                                              }`}
                                          >
                                              {isExpired ? 'Expired' : canJoin ? 'Join Room' : 'Opens 5 mins prior'}
                                          </button>
                                      )}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              )}
      </div>
      )}

    </DashboardLayout>
  );
}

export default CandidateDashboard;