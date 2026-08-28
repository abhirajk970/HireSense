import { useState, useEffect, useRef } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

const API = "http://localhost:5000/api/profile";

// ── Shared primitives ────────────────────────────────────────────────────────
const labelCls = "block text-xs font-bold uppercase tracking-wider t-text-muted mb-1.5";
const inputCls = "w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition";
const inputStyle = { background:"var(--bg-input)", borderColor:"var(--border)", color:"var(--text-primary)" };

function Field({ label, children }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor:"var(--border)" }}>
      <div>
        <p className="text-sm font-semibold t-text">{label}</p>
        {sub && <p className="text-xs t-text-muted mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-indigo-500" : "bg-gray-600"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function SaveBtn({ loading, label = "Save Changes", onClick }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="mt-5 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50">
      {loading ? "Saving…" : label}
    </button>
  );
}

function Card({ title, sub, children }) {
  return (
    <div className="rounded-2xl border p-6 mb-5" style={{ background:"var(--bg-card)", borderColor:"var(--border)" }}>
      {title && <h3 className="font-bold t-text text-sm mb-0.5">{title}</h3>}
      {sub   && <p className="text-xs t-text-muted mb-5">{sub}</p>}
      {children}
    </div>
  );
}

// ── Avatar component ─────────────────────────────────────────────────────────
function AvatarSection({ profile, userId, onUpdate }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const res = await axios.post(`${API}/${userId}/avatar`, fd);
      onUpdate(res.data.user);
    } catch { alert("Upload failed."); }
    finally { setUploading(false); }
  };

  const initials = profile.name?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-5 mb-6">
      <div className="relative flex-shrink-0">
        {profile.avatarUrl
          ? <img src={profile.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-indigo-500/30"/>
          : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-2xl">{initials}</div>
        }
        <button onClick={() => fileRef.current?.click()}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:bg-indigo-400 transition">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>
      <div>
        <p className="font-bold t-text">{profile.name}</p>
        <p className="text-xs t-text-muted capitalize">{profile.role}</p>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition">
          {uploading ? "Uploading…" : "Change photo"}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
    </div>
  );
}

// ── TABS ─────────────────────────────────────────────────────────────────────
const TAB_ICONS = {
  Profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  Security: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  Notifications: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  Account: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
};

export default function SettingsPage() {
  const userId = localStorage.getItem("userId");
  const role   = localStorage.getItem("role");

  const [tab, setTab]       = useState("Profile");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  // Security state
  const [pwForm, setPwForm] = useState({ currentPassword:"", newPassword:"", confirm:"" });
  const [emailForm, setEmailForm] = useState({ newEmail:"", currentPassword:"" });
  const [pwSaving, setPwSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  // Danger zone
  const [deletePass, setDeletePass] = useState("");
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    axios.get(`${API}/${userId}`)
      .then(r => setProfile(r.data))
      .catch(() => showToast("Could not load profile.", "error"))
      .finally(() => setLoading(false));
  }, [userId]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const r = await axios.put(`${API}/${userId}`, profile);
      setProfile(r.data);
      showToast("Profile saved successfully.");
    } catch (e) { showToast(e.response?.data?.msg || "Save failed.", "error"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return showToast("Passwords do not match.", "error");
    if (pwForm.newPassword.length < 8) return showToast("Minimum 8 characters.", "error");
    setPwSaving(true);
    try {
      await axios.put(`${API}/${userId}/change-password`, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showToast("Password updated.");
      setPwForm({ currentPassword:"", newPassword:"", confirm:"" });
    } catch (e) { showToast(e.response?.data?.msg || "Failed.", "error"); }
    finally { setPwSaving(false); }
  };

  const changeEmail = async () => {
    setPwSaving(true);
    try {
      const r = await axios.put(`${API}/${userId}/change-email`, emailForm);
      showToast(`Email changed to ${r.data.newEmail}.`);
      setProfile(p => ({ ...p, email: r.data.newEmail }));
      setEmailForm({ newEmail:"", currentPassword:"" });
    } catch (e) { showToast(e.response?.data?.msg || "Failed.", "error"); }
    finally { setPwSaving(false); }
  };

  const saveNotifs = async () => {
    setSaving(true);
    try {
      const { notifEmail, notifInApp, notifInterview, notifNewsletter } = profile;
      await axios.put(`${API}/${userId}/notifications`, { notifEmail, notifInApp, notifInterview, notifNewsletter });
      showToast("Notification preferences saved.");
    } catch { showToast("Failed.", "error"); }
    finally { setSaving(false); }
  };

  const deleteAccount = async () => {
    if (!window.confirm("This is permanent. Are you sure?")) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/${userId}`, { data: { currentPassword: deletePass } });
      localStorage.clear();
      window.location.href = "/";
    } catch (e) { showToast(e.response?.data?.msg || "Failed.", "error"); }
    finally { setDeleting(false); }
  };

  const set = (k) => (e) => setProfile(p => ({ ...p, [k]: e.target?.value ?? e }));

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    </DashboardLayout>
  );

  const tabs = ["Profile", "Security", "Notifications", "Account"];

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl animate-slideUp ${
          toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
        }`}>{toast.msg}</div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="mb-7">
          <h1 className="text-xl font-black t-text">Settings</h1>
          <p className="text-sm t-text-muted mt-1">Manage your account, security, and preferences.</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-7 border-b" style={{ borderColor:"var(--border)" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
                tab === t ? "border-indigo-500 text-indigo-400" : "border-transparent t-text-muted hover:t-text"
              }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={TAB_ICONS[t]}/>
              </svg>
              {t}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === "Profile" && profile && (
          <div>
            <Card title="Photo & Display">
              <AvatarSection profile={profile} userId={userId} onUpdate={p => { setProfile(p); showToast("Photo updated."); }}/>
            </Card>

            <Card title="Basic Information" sub="This information is displayed on your public profile.">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name">
                  <input className={inputCls} style={inputStyle} value={profile.name || ""} onChange={set("name")}/>
                </Field>
                <Field label="Phone">
                  <input className={inputCls} style={inputStyle} value={profile.phone || ""} onChange={set("phone")} placeholder="+91 98765 43210"/>
                </Field>
                <Field label="Location">
                  <input className={inputCls} style={inputStyle} value={profile.location || ""} onChange={set("location")} placeholder="City, Country"/>
                </Field>
                <Field label="Email">
                  <input className={inputCls} style={{ ...inputStyle, opacity:0.6 }} value={profile.email || ""} disabled/>
                </Field>
                <div className="col-span-2">
                  <Field label="Bio">
                    <textarea rows={3} className={inputCls} style={inputStyle} value={profile.bio || ""} onChange={set("bio")} placeholder="A short bio about yourself…"/>
                  </Field>
                </div>
              </div>
            </Card>

            {/* Candidate extras */}
            {role === "candidate" && (
              <Card title="Professional Details">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="LinkedIn URL">
                    <input className={inputCls} style={inputStyle} value={profile.linkedin || ""} onChange={set("linkedin")} placeholder="https://linkedin.com/in/…"/>
                  </Field>
                  <Field label="GitHub URL">
                    <input className={inputCls} style={inputStyle} value={profile.github || ""} onChange={set("github")} placeholder="https://github.com/…"/>
                  </Field>
                  <Field label="Portfolio URL">
                    <input className={inputCls} style={inputStyle} value={profile.portfolio || ""} onChange={set("portfolio")} placeholder="https://yoursite.com"/>
                  </Field>
                  <Field label="Expected Salary (LPA)">
                    <input type="number" className={inputCls} style={inputStyle} value={profile.expectedSalary || ""} onChange={set("expectedSalary")}/>
                  </Field>
                  <Field label="Institute / University">
                    <input className={inputCls} style={inputStyle} value={profile.instituteName || ""} onChange={set("instituteName")}/>
                  </Field>
                  <Field label="Experience (Years)">
                    <input type="number" className={inputCls} style={inputStyle} value={profile.experience || ""} onChange={set("experience")}/>
                  </Field>
                  <div className="col-span-2">
                    <Field label="Skills (comma-separated)">
                      <input className={inputCls} style={inputStyle} value={Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills || ""} onChange={set("skills")} placeholder="React, Node.js, Python…"/>
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Fields of Interest">
                      <input className={inputCls} style={inputStyle} value={Array.isArray(profile.fieldsOfInterest) ? profile.fieldsOfInterest.join(", ") : profile.fieldsOfInterest || ""} onChange={set("fieldsOfInterest")} placeholder="AI/ML, Web Dev…"/>
                    </Field>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Toggle label="Open to Work" sub="Visible to recruiters" checked={!!profile.openToWork} onChange={v => setProfile(p => ({ ...p, openToWork: v }))}/>
                </div>
              </Card>
            )}

            {/* Company extras */}
            {role === "company" && (
              <Card title="Company Details">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Company Name">
                    <input className={inputCls} style={inputStyle} value={profile.companyName || ""} onChange={set("companyName")}/>
                  </Field>
                  <Field label="Website">
                    <input className={inputCls} style={inputStyle} value={profile.website || ""} onChange={set("website")} placeholder="https://company.com"/>
                  </Field>
                  <Field label="Industry">
                    <input className={inputCls} style={inputStyle} value={profile.industry || ""} onChange={set("industry")} placeholder="Technology, Finance…"/>
                  </Field>
                  <Field label="Company Size">
                    <select className={inputCls} style={inputStyle} value={profile.companySize || ""} onChange={set("companySize")}>
                      <option value="">Select size</option>
                      {["1–10","11–50","51–200","201–500","500–1000","1000+"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Founded Year">
                    <input className={inputCls} style={inputStyle} value={profile.founded || ""} onChange={set("founded")} placeholder="2020"/>
                  </Field>
                  <div className="col-span-2">
                    <Field label="Company Description">
                      <textarea rows={3} className={inputCls} style={inputStyle} value={profile.description || ""} onChange={set("description")}/>
                    </Field>
                  </div>
                </div>
              </Card>
            )}

            {/* Interviewer extras */}
            {role === "interviewer" && (
              <Card title="Interviewer Preferences">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Specialty">
                    <select className={inputCls} style={inputStyle} value={profile.specialty || "HR"} onChange={set("specialty")}>
                      {["HR","Technical"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Timezone">
                    <select className={inputCls} style={inputStyle} value={profile.timezone || "Asia/Kolkata"} onChange={set("timezone")}>
                      {["Asia/Kolkata","America/New_York","America/Chicago","America/Los_Angeles","Europe/London","Europe/Berlin","Asia/Singapore","Australia/Sydney"].map(tz => <option key={tz}>{tz}</option>)}
                    </select>
                  </Field>
                  <Field label="Working Hours Start">
                    <input type="time" className={inputCls} style={inputStyle} value={profile.workStart || "09:00"} onChange={set("workStart")}/>
                  </Field>
                  <Field label="Working Hours End">
                    <input type="time" className={inputCls} style={inputStyle} value={profile.workEnd || "18:00"} onChange={set("workEnd")}/>
                  </Field>
                </div>
              </Card>
            )}

            <SaveBtn loading={saving} onClick={saveProfile}/>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {tab === "Security" && (
          <div>
            <Card title="Change Password" sub="Use a strong password with letters, numbers, and symbols.">
              <div className="space-y-4">
                <Field label="Current Password">
                  <input type="password" className={inputCls} style={inputStyle} value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword:e.target.value }))}/>
                </Field>
                <Field label="New Password">
                  <input type="password" className={inputCls} style={inputStyle} value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword:e.target.value }))}/>
                </Field>
                <Field label="Confirm New Password">
                  <input type="password" className={inputCls} style={inputStyle} value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm:e.target.value }))}/>
                </Field>
              </div>
              {pwForm.newPassword && (
                <div className="mt-3 flex gap-1.5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                      pwForm.newPassword.length >= i*3 ? (pwForm.newPassword.length >= 10 ? "bg-emerald-500" : pwForm.newPassword.length >= 7 ? "bg-amber-500" : "bg-red-500") : "bg-gray-700"
                    }`}/>
                  ))}
                  <span className="text-[10px] t-text-muted ml-2 self-center">{pwForm.newPassword.length < 7 ? "Weak" : pwForm.newPassword.length < 10 ? "Fair" : "Strong"}</span>
                </div>
              )}
              <SaveBtn loading={pwSaving} label="Update Password" onClick={changePassword}/>
            </Card>

            <Card title="Change Email" sub="You must verify your current password to change your email address.">
              <div className="space-y-4">
                <Field label="New Email Address">
                  <input type="email" className={inputCls} style={inputStyle} value={emailForm.newEmail} onChange={e => setEmailForm(p => ({ ...p, newEmail:e.target.value }))} placeholder="new@email.com"/>
                </Field>
                <Field label="Current Password">
                  <input type="password" className={inputCls} style={inputStyle} value={emailForm.currentPassword} onChange={e => setEmailForm(p => ({ ...p, currentPassword:e.target.value }))}/>
                </Field>
              </div>
              <SaveBtn loading={emailSaving} label="Update Email" onClick={changeEmail}/>
            </Card>

            <Card title="Active Sessions">
              <div className="flex items-center gap-4 py-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold t-text">Current Device</p>
                  <p className="text-xs t-text-muted">Logged in now · {new Date().toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"})}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">Active</span>
              </div>
            </Card>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab === "Notifications" && profile && (
          <Card title="Notification Preferences" sub="Control how and when we contact you.">
            <Toggle label="Email Notifications" sub="Receive updates and alerts via email" checked={!!profile.notifEmail} onChange={v => setProfile(p => ({ ...p, notifEmail:v }))}/>
            <Toggle label="In-App Notifications" sub="See notifications inside HireSense" checked={!!profile.notifInApp} onChange={v => setProfile(p => ({ ...p, notifInApp:v }))}/>
            <Toggle label="Interview Reminders" sub="Get reminded 30 min before an interview" checked={!!profile.notifInterview} onChange={v => setProfile(p => ({ ...p, notifInterview:v }))}/>
            <Toggle label="Product Updates" sub="Occasional news about new features" checked={!!profile.notifNewsletter} onChange={v => setProfile(p => ({ ...p, notifNewsletter:v }))}/>
            <SaveBtn loading={saving} onClick={saveNotifs}/>
          </Card>
        )}

        {/* ── ACCOUNT TAB ── */}
        {tab === "Account" && (
          <div>
            <Card title="Account Information">
              <div className="space-y-2 text-sm">
                {[["Role", profile?.role], ["Member since", new Date(profile?.createdAt).toLocaleDateString("en-IN",{month:"long",day:"numeric",year:"numeric"})], ["User ID", userId]].map(([k,v]) => (
                  <div key={k} className="flex justify-between py-2 border-b last:border-0" style={{ borderColor:"var(--border)" }}>
                    <span className="t-text-muted font-medium">{k}</span>
                    <span className="t-text font-semibold capitalize truncate ml-4 max-w-[60%] text-right">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="rounded-2xl border border-red-500/20 p-6" style={{ background:"rgba(239,68,68,0.03)" }}>
              <h3 className="font-bold text-red-400 text-sm mb-1">Danger Zone</h3>
              <p className="text-xs t-text-muted mb-5">Deleting your account is permanent and cannot be undone. All your data will be erased.</p>
              <Field label="Enter your password to confirm">
                <input type="password" className={inputCls} style={inputStyle} value={deletePass} onChange={e => setDeletePass(e.target.value)} placeholder="Current password"/>
              </Field>
              <button onClick={deleteAccount} disabled={!deletePass || deleting}
                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-40">
                {deleting ? "Deleting…" : "Delete My Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
