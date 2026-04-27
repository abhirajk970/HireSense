import { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import JobApplicantsManager from "../components/JobApplicantsManager";

function CompanyDashboard() {
  const [job, setJob] = useState({
    title: "",
    description: "",
    requiredSkills: [],
    experienceRequired: 0,
    location: "Remote",
    jobType: "Full-time",
    salaryRange: "",
    numberOfOpenings: 1,
    stages: [], // Array of rich objects
    applicationDeadline: ""
  });
  
  const [skillInput, setSkillInput] = useState("");
  const [stageInput, setStageInput] = useState("Resume Screening");
  
  const PREDEFINED_STAGES = ["Resume Screening", "MCQ Assessment", "DSA Assessment", "Technical Interview", "Final Review", "Assignment"];
  
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
  const [activeJobForApplicants, setActiveJobForApplicants] = useState(null);
  const [rescheduleJob, setRescheduleJob] = useState(null); // job being rescheduled/edited

  const companyId = localStorage.getItem("userId");

  const fetchJobs = async () => {
      try {
          const res = await axios.get("http://localhost:5000/api/jobs");
          const myJobs = res.data.filter(j => j.createdBy?._id === companyId);
          setJobs(myJobs);
      } catch (err) {
          console.error(err);
      }
  };

  const fetchApplicants = async () => {
      try {
          const res = await axios.get(`http://localhost:5000/api/applications/company/${companyId}`);
          setApplicants(res.data);
      } catch (err) {
          console.error(err);
      }
  }

  const fetchDashboardData = async () => {
       await fetchJobs();
       await fetchApplicants();
       await fetchInterviews();
  };

  const fetchInterviews = async () => {
       try {
           const res = await axios.get(`http://localhost:5000/api/interviews/company/${companyId}`);
           setInterviews(res.data);
       } catch (err) {
           console.error(err);
       }
  };

  useEffect(() => {
      if (activeTab === "viewJobs") fetchJobs();
      if (activeTab === "viewApplicants") {
          fetchDashboardData();
          setActiveJobForApplicants(null);
      }
      if (activeTab === "viewInterviews") {
          fetchInterviews();
      }
  }, [activeTab]);

  const handleScheduleOA = async (appId) => {
      try {
          const response = await axios.post(`http://localhost:5000/api/applications/${appId}/shortlist`);
          if (response.data.previewUrl) {
              alert(`Candidate Shortlisted for DSA & Email Sent!\nPreview URL: ${response.data.previewUrl}`);
          } else {
              alert("Candidate Shortlisted for DSA Assessment.");
          }
          fetchApplicants();
      } catch (err) {
          alert(`Failed to shortlist: ${err.response?.data?.msg || err.message}`);
      }
  };

  const createJob = async () => {
    if (job.requiredSkills.length === 0 || job.stages.length === 0) {
        return alert("Please add at least one Required Skill and one Stage.");
    }

    try {
        await axios.post("http://localhost:5000/api/jobs", {
            ...job,
            applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline) : null,
            createdBy: companyId
        });
        alert("Job Created Successfully");
        setJob({ title: "", description: "", requiredSkills: [], experienceRequired: 0, location: "Remote", jobType: "Full-time", salaryRange: "", numberOfOpenings: 1, stages: [], applicationDeadline: "" });
        setActiveTab("viewJobs");
    } catch(err) {
        alert("Failed to create job");
    }
  };

  const closeJob = async (id) => {
    if (!confirm("Close this listing? It will be hidden from candidates.")) return;
    try { await axios.put(`http://localhost:5000/api/jobs/${id}/close`); fetchJobs(); }
    catch(e) { alert("Failed to close job"); }
  };

  const reopenJob = async (id) => {
    try { await axios.put(`http://localhost:5000/api/jobs/${id}/reopen`); fetchJobs(); }
    catch(e) { alert("Failed to reopen job"); }
  };

  const deleteJob = async (id) => {
    if (!confirm("Permanently delete this job? This cannot be undone.")) return;
    try { await axios.delete(`http://localhost:5000/api/jobs/${id}`); fetchJobs(); }
    catch(e) { alert("Failed to delete job"); }
  };

  const saveSchedule = async () => {
    if (!rescheduleJob) return;
    try {
      await axios.put(`http://localhost:5000/api/jobs/${rescheduleJob._id}/stages`, {
        stages: rescheduleJob.stages,
        applicationDeadline: rescheduleJob.applicationDeadline
      });
      alert("Pipeline updated!");
      setRescheduleJob(null);
      fetchJobs();
    } catch(e) {
      alert("Failed to update pipeline");
    }
  };

  const addSkill = () => {
      if(skillInput.trim() && !job.requiredSkills.includes(skillInput.trim())) {
          setJob({ ...job, requiredSkills: [...job.requiredSkills, skillInput.trim()] });
          setSkillInput("");
      }
  };

  const removeSkill = (skill) => {
      setJob({ ...job, requiredSkills: job.requiredSkills.filter(s => s !== skill) });
  };

  // Allow duplicates in stages array by not checking includes
  const addStageToJob = (targetJob, setTargetJob, stageName) => {
      if(stageName) {
          const newStage = {
              name: stageName,
              startDate: "",
              endDate: "",
              advanceMode: "Manual",
              advanceTopK: 0,
              interviewType: stageName.includes("Interview") ? "Human" : "None"
          };
          setTargetJob({ 
              ...targetJob, 
              stages: [...targetJob.stages, newStage]
          });
      }
  };

  const removeStageFromJob = (idx, targetJob, setTargetJob) => {
      const updated = [...targetJob.stages];
      updated.splice(idx, 1);
      setTargetJob({ ...targetJob, stages: updated });
  };

  const updateStageConfig = (idx, field, value, targetJob, setTargetJob) => {
      const updated = [...targetJob.stages];
      updated[idx] = { ...updated[idx], [field]: value };
      setTargetJob({ ...targetJob, stages: updated });
  };

  const tabs = [
    { id: "create", label: "Create Job", icon: "M12 4v16m8-8H4" },
    { id: "viewJobs", label: "My Jobs", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { id: "viewApplicants", label: "Applicants", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "viewInterviews", label: "Interviews", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" }
  ];

  const inputClass = "w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition";
  const inputStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' };
  const labelClass = "block text-xs font-semibold t-text-muted mb-1.5 uppercase tracking-wider";

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const statusBadge = (status) => {
    switch(status) {
      case "Active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Closed": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "Stopped": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold t-text">Company Dashboard</h1>
          <p className="text-sm t-text-muted mt-1">Manage openings, applicants, and hiring pipeline</p>
        </div>
        <div className="flex rounded-xl p-1 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-violet-500/15 text-violet-400 shadow-lg shadow-violet-500/5' : 't-text-muted hover:t-text'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}/></svg>
                {tab.label}
              </button>
            ))}
        </div>
      </div>

      {/* ═══ CREATE JOB TAB ═══ */}
      {activeTab === "create" && (
          <div className="rounded-2xl border p-8 max-w-4xl" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-bold mb-6 t-text border-b pb-4 flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              </span>
              Create a New Job Listing
            </h2>
            
            <div className="grid grid-cols-2 gap-5 mb-4">
                <div className="col-span-2">
                    <label className={labelClass}>Job Title</label>
                    <input className={inputClass} style={inputStyle} placeholder="e.g. Senior Frontend Developer" value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} />
                </div>

                <div className="col-span-2">
                     <label className={labelClass}>Job Description</label>
                    <textarea rows="4" className={inputClass + " resize-none"} style={inputStyle} placeholder="Describe the role..." value={job.description} onChange={(e) => setJob({ ...job, description: e.target.value })} />
                </div>

                <div className="col-span-2">
                     <label className={labelClass}>Required Skills</label>
                     <div className="flex flex-wrap gap-2 mb-2">
                         {job.requiredSkills.map(skill => (
                             <span key={skill} className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-lg text-sm font-semibold flex items-center border border-indigo-500/20">
                                 {skill}
                                 <button type="button" onClick={() => removeSkill(skill)} className="ml-2 text-indigo-400 hover:text-white font-bold">&times;</button>
                             </span>
                         ))}
                     </div>
                     <div className="flex gap-2">
                         <input className={inputClass + " flex-1"} style={inputStyle} placeholder="e.g. React, Python" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                         <button type="button" onClick={addSkill} className="border font-semibold px-4 py-2 rounded-xl transition text-sm t-text-muted" style={{ borderColor: 'var(--border)' }}>Add</button>
                     </div>
                </div>

                <div>
                    <label className={labelClass}>Min. Experience (Years)</label>
                    <input type="number" min="0" className={inputClass} style={inputStyle} value={job.experienceRequired} onChange={(e) => setJob({ ...job, experienceRequired: parseInt(e.target.value) || 0 })} />
                </div>

                 <div>
                    <label className={labelClass}>Location</label>
                    <input className={inputClass} style={inputStyle} placeholder="Remote, New York, etc." value={job.location} onChange={(e) => setJob({ ...job, location: e.target.value })} />
                </div>

                 <div>
                    <label className={labelClass}>Job Type</label>
                    <select className={inputClass + " appearance-none"} style={inputStyle} value={job.jobType} onChange={(e) => setJob({ ...job, jobType: e.target.value })}>
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Salary Range</label>
                    <input className={inputClass} style={inputStyle} placeholder="e.g. $80k - $120k" value={job.salaryRange} onChange={(e) => setJob({ ...job, salaryRange: e.target.value })} />
                </div>
                
                <div>
                     <label className={labelClass}>Number of Openings</label>
                     <input type="number" min="1" className={inputClass} style={inputStyle} value={job.numberOfOpenings} onChange={(e) => setJob({ ...job, numberOfOpenings: parseInt(e.target.value) || 1 })} />
                </div>

                {/* Application Deadline */}
                <div>
                    <label className={labelClass}>Application Deadline</label>
                    <input type="datetime-local" className={inputClass} style={inputStyle} value={job.applicationDeadline} onChange={(e) => setJob({ ...job, applicationDeadline: e.target.value })} />
                </div>

                {/* Intelligent Pipeline Builder */}
                <div className="col-span-2 mt-4 bg-indigo-500/5 p-5 rounded-xl border border-indigo-500/10">
                     <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      Intelligent Pipeline Builder
                    </h3>
                    <p className="text-xs text-indigo-400/80 mb-5">Configure each stage, its timeline, auto-advance rules, and interview tech.</p>

                     <div className="flex gap-2 mb-6">
                         <select className={inputClass + " flex-1 appearance-none"} style={inputStyle} value={stageInput} onChange={(e) => setStageInput(e.target.value)}>
                             <option disabled value="">Select a Round Type...</option>
                             {PREDEFINED_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                         <button type="button" onClick={() => addStageToJob(job, setJob, stageInput)} className="border font-semibold px-4 py-2 rounded-xl transition text-sm t-text-muted" style={{ borderColor: 'var(--border)' }}>Append Round</button>
                     </div>

                     <div className="space-y-4">
                        {job.stages.map((stage, idx) => (
                           <div key={idx} className="relative rounded-xl border p-4 transition-all" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                              <button onClick={() => removeStageFromJob(idx, job, setJob)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition">&times;</button>
                              
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                                <h4 className="font-bold t-text">{stage.name}</h4>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                      <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">Advance Mode</label>
                                      <select className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} value={stage.advanceMode || "Manual"} onChange={e => updateStageConfig(idx, "advanceMode", e.target.value, job, setJob)}>
                                          <option value="Manual">Manual</option>
                                          <option value="Auto">Auto (Top K)</option>
                                      </select>
                                  </div>
                                  {stage.advanceMode === "Auto" && (
                                      <div>
                                          <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">Top K</label>
                                          <input type="number" min="1" className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} placeholder="e.g. 10" value={stage.advanceTopK || ""} onChange={e => updateStageConfig(idx, "advanceTopK", parseInt(e.target.value) || 0, job, setJob)} />
                                      </div>
                                  )}
                                  {stage.name.includes("Interview") && (
                                     <div>
                                        <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">Interview Type</label>
                                        <select className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} value={stage.interviewType || "Human"} onChange={e => updateStageConfig(idx, "interviewType", e.target.value, job, setJob)}>
                                            <option value="Human">Human</option>
                                            <option value="AI">AI Agent</option>
                                        </select>
                                    </div>
                                  )}
                                  <div>
                                    <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">Start Date</label>
                                    <input type="datetime-local" className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} value={stage.startDate || ""} onChange={e => updateStageConfig(idx, "startDate", e.target.value, job, setJob)} />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">End Date</label>
                                    <input type="datetime-local" className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} value={stage.endDate || ""} onChange={e => updateStageConfig(idx, "endDate", e.target.value, job, setJob)} />
                                  </div>
                              </div>
                           </div>
                        ))}
                        {job.stages.length === 0 && (
                            <div className="text-center p-8 border border-dashed rounded-xl t-text-dimmed" style={{ borderColor: 'var(--border)' }}>
                                No stages added yet. Add a round to build your pipeline.
                            </div>
                        )}
                     </div>
                </div>
            </div>

            <button className="mt-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all w-full hover:-translate-y-0.5" onClick={createJob}>
              Post Job
            </button>

          </div>
      )}

      {/* ═══ MY JOBS TAB ═══ */}
      {activeTab === "viewJobs" && (
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="rounded-2xl border p-12 text-center t-text-dimmed" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>No jobs posted yet.</div>
            ) : jobs.map(j => (
              <div key={j._id} className="rounded-2xl border p-5 transition-all" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold t-text truncate">{j.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-extrabold uppercase tracking-wider border ${statusBadge(j.processStatus || "Active")}`}>
                        {j.processStatus || "Active"}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs t-text-muted font-medium">
                      <span>{j.jobType}</span>
                      <span>{j.location}</span>
                      <span>{j.experienceRequired}+ yrs</span>
                      {j.applicationDeadline && <span>Deadline: {formatDate(j.applicationDeadline)}</span>}
                    </div>

                    {/* Schedule timeline */}
                    {j.stages && j.stages.length > 0 && (
                      <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1">
                        {j.stages.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <div className="text-[10px] px-2 py-1 rounded-lg border flex flex-col gap-0.5" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                              <span className="font-bold text-indigo-400 whitespace-nowrap">{s.name}</span>
                              <div className="flex gap-2 text-gray-500 font-medium whitespace-nowrap">
                                  <span>{s.advanceMode === "Auto" ? `Auto (Top ${s.advanceTopK})` : "Manual"}</span>
                                  {s.interviewType !== "None" && <span className="text-emerald-400">• {s.interviewType}</span>}
                              </div>
                              {s.startDate && <span className="t-text-dimmed mt-0.5 border-t pt-0.5" style={{ borderColor: 'var(--border)' }}>{formatDate(s.startDate)}</span>}
                            </div>
                            {idx < j.stages.length - 1 && <span className="text-gray-600 text-xs mx-1">→</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button onClick={() => setRescheduleJob({ ...j, stages: j.stages || [] })} className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all t-text-muted hover:text-indigo-400 hover:border-indigo-500/30" style={{ borderColor: 'var(--border)' }} title="Edit Pipeline">
                      <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      Config
                    </button>
                    {(j.processStatus === "Active" || !j.processStatus) ? (
                      <button onClick={() => closeJob(j._id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 transition-all">Close</button>
                    ) : j.processStatus === "Closed" ? (
                      <button onClick={() => reopenJob(j._id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all">Reopen</button>
                    ) : null}
                    <button onClick={() => deleteJob(j._id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all" title="Delete permanently">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      )}

      {/* ═══ EDIT PIPELINE MODAL ═══ */}
      {rescheduleJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setRescheduleJob(null)}>
          <div className="rounded-2xl border p-6 w-full max-w-4xl shadow-2xl my-auto" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold t-text mb-1">Pipeline Config: {rescheduleJob.title}</h2>
            <p className="text-xs t-text-muted mb-5">Update stages, auto-advance rules, interview configurations, and schedule.</p>

            <div className="mb-5 flex gap-4 items-end">
              <div className="flex-1">
                  <label className={labelClass}>Application Deadline</label>
                  <input type="datetime-local" className={inputClass} style={inputStyle}
                    value={rescheduleJob.applicationDeadline ? new Date(rescheduleJob.applicationDeadline).toISOString().slice(0,16) : ""}
                    onChange={e => setRescheduleJob({ ...rescheduleJob, applicationDeadline: e.target.value })} />
              </div>
              <div className="flex-1 flex gap-2">
                 <select className={inputClass + " appearance-none"} style={inputStyle} value={stageInput} onChange={(e) => setStageInput(e.target.value)}>
                     <option disabled value="">Select Round...</option>
                     {PREDEFINED_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <button type="button" onClick={() => addStageToJob(rescheduleJob, setRescheduleJob, stageInput)} className="border font-semibold px-4 py-2 rounded-xl transition text-sm t-text-muted whitespace-nowrap" style={{ borderColor: 'var(--border)' }}>+ Round</button>
              </div>
            </div>

            <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto pr-2">
              {rescheduleJob.stages.map((stage, idx) => (
                   <div key={idx} className="relative rounded-xl border p-4 transition-all" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                      <button onClick={() => removeStageFromJob(idx, rescheduleJob, setRescheduleJob)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition">&times;</button>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                        <h4 className="font-bold t-text">{stage.name}</h4>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                              <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">Advance Mode</label>
                              <select className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} value={stage.advanceMode || "Manual"} onChange={e => updateStageConfig(idx, "advanceMode", e.target.value, rescheduleJob, setRescheduleJob)}>
                                  <option value="Manual">Manual</option>
                                  <option value="Auto">Auto (Top K)</option>
                              </select>
                          </div>
                          {stage.advanceMode === "Auto" && (
                              <div>
                                  <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">Top K</label>
                                  <input type="number" min="1" className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} placeholder="e.g. 10" value={stage.advanceTopK || ""} onChange={e => updateStageConfig(idx, "advanceTopK", parseInt(e.target.value) || 0, rescheduleJob, setRescheduleJob)} />
                              </div>
                          )}
                          {stage.name.includes("Interview") && (
                             <div>
                                <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">Interview Type</label>
                                <select className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} value={stage.interviewType || "Human"} onChange={e => updateStageConfig(idx, "interviewType", e.target.value, rescheduleJob, setRescheduleJob)}>
                                    <option value="Human">Human</option>
                                    <option value="AI">AI Agent</option>
                                </select>
                            </div>
                          )}
                          <div>
                            <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">Start Date</label>
                            <input type="datetime-local" className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} value={stage.startDate ? new Date(stage.startDate).toISOString().slice(0,16) : ""} onChange={e => updateStageConfig(idx, "startDate", e.target.value, rescheduleJob, setRescheduleJob)} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold t-text-muted uppercase mb-1">End Date</label>
                            <input type="datetime-local" className="w-full border rounded-lg p-2 text-sm outline-none" style={inputStyle} value={stage.endDate ? new Date(stage.endDate).toISOString().slice(0,16) : ""} onChange={e => updateStageConfig(idx, "endDate", e.target.value, rescheduleJob, setRescheduleJob)} />
                          </div>
                      </div>
                   </div>
                ))}
                {rescheduleJob.stages.length === 0 && (
                    <div className="text-center p-8 border border-dashed rounded-xl t-text-dimmed" style={{ borderColor: 'var(--border)' }}>
                        No stages left. Add a round to continue.
                    </div>
                )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRescheduleJob(null)} className="flex-1 py-2.5 rounded-xl font-semibold border text-sm t-text-muted transition-all" style={{ borderColor: 'var(--border)' }}>Cancel</button>
              <button onClick={saveSchedule} className="flex-1 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 text-sm transition-all hover:-translate-y-0.5">Save Pipeline Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ APPLICANTS TAB ═══ */}
      {activeTab === "viewApplicants" && !activeJobForApplicants && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               {jobs.length === 0 ? (
                   <div className="col-span-full text-center t-text-dimmed p-12 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>No active postings yet.</div>
               ) : jobs.map(jobItem => (
                   <div key={jobItem._id} className="group rounded-2xl border p-6 cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden t-card t-card-hover" onClick={() => setActiveJobForApplicants(jobItem)}>
                       <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <h3 className="text-lg font-bold mb-2 truncate pr-6 group-hover:text-indigo-400 transition-colors t-text">{jobItem.title}</h3>
                       <div className="flex justify-between items-center mb-4">
                           <p className="text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-lg text-sm border border-indigo-500/20">{applicants.filter(a => a.jobId?._id === jobItem._id).length} Candidate(s)</p>
                           <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-lg border ${statusBadge(jobItem.processStatus || 'Active')}`}>{jobItem.processStatus || 'Active'}</span>
                       </div>
                       <div className="text-sm t-text-muted font-medium">Pipeline: {jobItem.stages?.length || 0} Stages</div>
                       {jobItem.applicationDeadline && <div className="text-[10px] t-text-dimmed mt-1">Deadline: {formatDate(jobItem.applicationDeadline)}</div>}
                   </div>
               ))}
           </div>
      )}

      {activeTab === "viewApplicants" && activeJobForApplicants && (
           <JobApplicantsManager 
              job={jobs.find(j => j._id === activeJobForApplicants._id) || activeJobForApplicants} 
              applicants={applicants.filter(a => a.jobId?._id === activeJobForApplicants._id)} 
              onBack={() => setActiveJobForApplicants(null)} 
              handleScheduleOA={handleScheduleOA} 
              fetchDashboardData={fetchDashboardData}
           />
      )}

      {/* ═══ INTERVIEWS TAB ═══ */}
      {activeTab === "viewInterviews" && (
          <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4 t-text">Scheduled Interviews</h2>
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
                                          {inv.interviewMode === 'AI' && <span className="text-[9px] bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20 font-bold mt-1 inline-block">🤖 AI Powered</span>}
                                      </div>
                                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${inv.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>{inv.status}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">
                                          {inv.candidateId?.name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-white">{inv.candidateId?.name}</p>
                                          <p className="text-[10px] text-gray-400">{inv.candidateId?.email}</p>
                                      </div>
                                  </div>

                                  <div className="flex items-center justify-between mt-auto border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                      <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                          {new Date(inv.scheduledAt).toLocaleString()}
                                      </div>
                                      
                                      {inv.interviewMode === 'AI' ? (
                                          <span className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                              {inv.status === 'Completed' ? 'View AI Report' : '🤖 AI Managed'}
                                          </span>
                                      ) : inv.status === 'Scheduled' && (
                                          <button 
                                              disabled={!canJoin && !isExpired}
                                              onClick={() => {
                                                  if(isExpired) {
                                                      alert('This interview has unfortunately expired as it is past the 1-hour active window limit.');
                                                  } else {
                                                      window.open(`http://localhost:5178/room/${inv.roomId}?role=interviewer`, '_blank');
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

export default CompanyDashboard;