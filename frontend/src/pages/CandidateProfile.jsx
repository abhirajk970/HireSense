import { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import { useNavigate } from "react-router-dom";

function CandidateProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [file, setFile] = useState(null);
    const [skillInput, setSkillInput] = useState("");
    const [fieldInput, setFieldInput] = useState("");

    const navigate = useNavigate();
    const candidateId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");

    useEffect(() => {
        if (role !== "candidate") {
            navigate("/");
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/profile/${candidateId}`);
                setProfile(res.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
                setMessage("Could not load profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [candidateId, role, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    const addSkill = () => {
        if (skillInput.trim() && !profile.skills?.includes(skillInput.trim())) {
            setProfile({ ...profile, skills: [...(profile.skills || []), skillInput.trim()] });
            setSkillInput("");
        }
    };
    const removeSkill = (skill) => {
        setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
    };

    const addField = () => {
        if (fieldInput.trim() && !profile.fieldsOfInterest?.includes(fieldInput.trim())) {
            setProfile({ ...profile, fieldsOfInterest: [...(profile.fieldsOfInterest || []), fieldInput.trim()] });
            setFieldInput("");
        }
    };
    const removeField = (field) => {
        setProfile({ ...profile, fieldsOfInterest: profile.fieldsOfInterest.filter(s => s !== field) });
    };

    const saveProfile = async () => {
        setSaving(true);
        setMessage("");
        try {
            const dataToUpdate = { ...profile };
            await axios.put(`http://localhost:5000/api/profile/${candidateId}`, dataToUpdate);
            setMessage("Profile updated successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            setMessage("Failed to save profile.");
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleUpload = async () => {
        if (!file) return setMessage("Please select a file first.");
        
        setUploading(true);
        setMessage("Uploading and analyzing your resume with AI... Please wait.");
        
        const formData = new FormData();
        formData.append("resume", file);

        try {
            const res = await axios.post(`http://localhost:5000/api/profile/${candidateId}/upload-resume`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            setMessage(res.data.msg);
            const updatedProfile = await axios.get(`http://localhost:5000/api/profile/${candidateId}`);
            setProfile(updatedProfile.data);
            setFile(null);
        } catch (error) {
            console.error("Upload error:", error);
            setMessage("Failed to upload and parse resume.");
        } finally {
            setUploading(false);
            setTimeout(() => setMessage(""), 5000);
        }
    };

    const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] text-white p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition placeholder-gray-600";
    const labelClass = "block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider";

    if (loading) return <DashboardLayout><div className="flex h-[60vh] items-center justify-center"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto pb-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                      <h1 className="text-2xl font-bold text-white">My Profile</h1>
                      <p className="text-sm text-gray-500 mt-1">Manage your information and resume</p>
                    </div>
                    <button 
                        onClick={saveProfile} 
                        disabled={saving}
                        className={`px-6 py-2.5 rounded-xl text-white font-semibold shadow-lg transition-all text-sm ${saving ? 'bg-indigo-500/50 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-indigo-500/25 hover:-translate-y-0.5'}`}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded-xl font-medium text-sm border ${message.includes('successfully') || message.includes('AI') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {message}
                    </div>
                )}

                {/* Personal Details */}
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-8 mb-6 space-y-6">
                    <h2 className="text-base font-bold text-white border-b border-white/[0.06] pb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      Personal Details
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Full Name</label>
                            <input type="text" name="name" value={profile?.name || ''} onChange={handleInputChange}
                                className={inputClass + " opacity-50 cursor-not-allowed"} disabled />
                        </div>
                        <div>
                            <label className={labelClass}>Email Address</label>
                            <input type="email" name="email" value={profile?.email || ''} onChange={handleInputChange}
                                className={inputClass + " opacity-50 cursor-not-allowed"} disabled />
                        </div>
                        <div>
                            <label className={labelClass}>Location</label>
                            <input type="text" name="location" value={profile?.location || ''} onChange={handleInputChange}
                                className={inputClass} placeholder="e.g. San Francisco, CA" />
                        </div>
                        <div>
                            <label className={labelClass}>Expected Salary (USD)</label>
                            <input type="number" name="expectedSalary" value={profile?.expectedSalary || ''} onChange={handleInputChange}
                                className={inputClass} placeholder="e.g. 120000" />
                        </div>
                    </div>
                </div>

                {/* Education & Skills */}
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-8 mb-6 space-y-6">
                    <h2 className="text-base font-bold text-white border-b border-white/[0.06] pb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                      Education & Experience
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Institute Name</label>
                            <input type="text" name="instituteName" value={profile?.instituteName || ''} onChange={handleInputChange}
                                className={inputClass} placeholder="e.g. MIT, Stanford..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Years Exp</label>
                                <input type="number" name="experience" value={profile?.experience || 0} onChange={handleInputChange}
                                    className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>CGPA</label>
                                <input type="number" step="0.1" name="cgpa" value={profile?.cgpa || 0} onChange={handleInputChange}
                                    className={inputClass} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Skills</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                             {(profile?.skills || []).map(skill => (
                                 <span key={skill} className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-lg text-sm font-semibold flex items-center border border-indigo-500/20">
                                     {skill}
                                     <button type="button" onClick={() => removeSkill(skill)} className="ml-2 text-indigo-400 hover:text-white font-bold">&times;</button>
                                 </span>
                             ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                                className={inputClass + " flex-1"} placeholder="e.g. React, Node.js, Python" />
                            <button type="button" onClick={addSkill} className="bg-white/[0.06] border border-white/[0.1] text-gray-300 font-semibold px-4 py-2 rounded-xl hover:bg-white/[0.1] transition text-sm">Add</button>
                        </div>
                        <p className="mt-2 text-xs text-gray-600">Skills are used to calculate your Match Score.</p>
                    </div>

                    <div>
                        <label className={labelClass}>Fields of Interest</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                             {(profile?.fieldsOfInterest || []).map(field => (
                                 <span key={field} className="bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-lg text-sm font-semibold flex items-center border border-cyan-500/20">
                                     {field}
                                     <button type="button" onClick={() => removeField(field)} className="ml-2 text-cyan-400 hover:text-white font-bold">&times;</button>
                                 </span>
                             ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={fieldInput} onChange={(e) => setFieldInput(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addField(); } }}
                                className={inputClass + " flex-1"} placeholder="e.g. Frontend, Machine Learning, UI/UX" />
                            <button type="button" onClick={addField} className="bg-white/[0.06] border border-white/[0.1] text-gray-300 font-semibold px-4 py-2 rounded-xl hover:bg-white/[0.1] transition text-sm">Add</button>
                        </div>
                    </div>
                </div>

                {/* Social Profiles */}
                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-8 mb-6 space-y-6">
                    <h2 className="text-base font-bold text-white border-b border-white/[0.06] pb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                      Social Profiles
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>LinkedIn URL</label>
                            <input type="url" name="linkedin" value={profile?.linkedin || ''} onChange={handleInputChange}
                                className={inputClass} placeholder="https://linkedin.com/in/username" />
                        </div>
                        <div>
                            <label className={labelClass}>GitHub URL</label>
                            <input type="url" name="github" value={profile?.github || ''} onChange={handleInputChange}
                                className={inputClass} placeholder="https://github.com/username" />
                        </div>
                    </div>
                </div>

                {/* AI Resume Section */}
                <div className="bg-gradient-to-br from-indigo-500/[0.08] to-violet-500/[0.08] rounded-2xl border border-indigo-500/15 p-8">
                    <h2 className="text-base font-bold text-white border-b border-white/[0.06] pb-4 mb-6 flex items-center gap-2">
                      <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                      </span>
                      AI Resume Parsing
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                        Upload your latest resume. Our AI will automatically extract your skills, compute your experience, and update your profile.
                    </p>
                    
                    <div className="flex flex-col md:flex-row items-stretch gap-4">
                        <label className="flex-1 flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-500/20 border-dashed rounded-xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-3 text-indigo-400 group-hover:text-indigo-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                <p className="mb-1 text-sm text-gray-500"><span className="font-semibold text-indigo-400">Click to select PDF</span></p>
                                <p className="text-xs text-gray-600">{file ? file.name : "No file selected"}</p>
                            </div>
                            <input type="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
                        </label>
                        
                        <button 
                            onClick={handleUpload}
                            disabled={uploading || !file}
                            className={`min-w-[150px] px-6 py-4 rounded-xl text-white font-bold shadow-lg transition-all h-32 ${uploading || !file ? 'bg-indigo-500/30 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-indigo-500/25 hover:-translate-y-0.5'}`}
                        >
                            {uploading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Analyzing...
                                </span>
                            ) : "Upload & Analyze"}
                        </button>
                    </div>
                    {profile.resumeUrl && (
                        <p className="mt-4 text-xs font-semibold text-emerald-400 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Active resume uploaded. Uploading a new one will replace it.
                        </p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default CandidateProfile;
