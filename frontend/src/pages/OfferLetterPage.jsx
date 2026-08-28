import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

const API = "http://localhost:5000/api";

export default function OfferLetterPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confetti effect state
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${API}/jobs/${jobId}`);
        setJob(res.data);
        setTimeout(() => setShowConfetti(true), 500);
      } catch (err) {
        setError('Could not load offer details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const acceptOffer = () => {
    alert("Offer Accepted! HR will contact you shortly with onboarding details.");
    navigate('/candidate');
  };

  const declineOffer = () => {
    if(window.confirm("Are you sure you want to decline this offer?")) {
      navigate('/candidate');
    }
  };

  return (
    <div className="flex h-screen bg-black" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        
        {/* Confetti overlay */}
        {showConfetti && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
             {Array.from({length: 50}).map((_, i) => (
                <div key={i} className="absolute animate-fall" 
                     style={{
                        left: `${Math.random() * 100}vw`,
                        top: `-20px`,
                        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random()*5)],
                        width: `${Math.random() * 10 + 5}px`,
                        height: `${Math.random() * 10 + 5}px`,
                        animationDuration: `${Math.random() * 3 + 2}s`,
                        animationDelay: `${Math.random() * 2}s`,
                        transform: `rotate(${Math.random() * 360}deg)`
                     }}
                />
             ))}
             <style>{`
               @keyframes fall {
                 to { transform: translateY(100vh) rotate(720deg); }
               }
               .animate-fall { animation-name: fall; animation-timing-function: linear; animation-fill-mode: forwards; }
             `}</style>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gradient-to-b from-[#0a0a0f] to-black">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-400 font-bold">{error}</div>
          ) : (
            <div className="max-w-3xl mx-auto mt-8 pb-12">
              {/* Header Badge */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.3)] mb-6 transform hover:scale-105 transition-transform duration-500">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight mb-2">
                  Congratulations!
                </h1>
                <p className="text-gray-400 text-lg">You've received an offer for <strong className="text-white">{job.title}</strong></p>
              </div>

              {/* Offer Letter Paper */}
              <div className="relative bg-[#0d0d12]/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-10 md:p-14 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-32 -mb-32 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />
                
                <div className="relative z-10 space-y-8">
                  {/* Company Info Header */}
                  <div className="flex items-start justify-between border-b border-white/[0.05] pb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{job.companyId?.name || "The Company"}</h2>
                      <p className="text-sm text-gray-500 font-mono">Official Offer of Employment</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="text-sm text-gray-400">Ref: HS-OFR-{job._id?.slice(-6).toUpperCase() || "1A2B3C"}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="text-gray-300 space-y-5 leading-relaxed text-[15px]">
                    <p>Dear Candidate,</p>
                    <p>
                      We were incredibly impressed by your background, your performance in the assessments, and the technical expertise you demonstrated throughout the interview process. It is our pleasure to formally extend an offer of employment for the position of <strong className="text-white">{job.title}</strong> at our company.
                    </p>
                    
                    <div className="bg-black/40 border border-white/[0.05] rounded-2xl p-6 my-8">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Position Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Job Title</p>
                          <p className="text-sm font-semibold text-white">{job.title}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Employment Type</p>
                          <p className="text-sm font-semibold text-white">{job.employmentType || "Full-Time"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Location</p>
                          <p className="text-sm font-semibold text-white">{job.location || "Remote / On-site"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Expected Start Date</p>
                          <p className="text-sm font-semibold text-white">To be determined</p>
                        </div>
                      </div>
                    </div>

                    <p>
                      We believe your skills will be a tremendous asset to our team and we are excited about the prospect of you joining us. Please review the details of this offer and let us know your decision. 
                    </p>
                    <p>
                      We look forward to welcoming you aboard!
                    </p>

                    <div className="pt-6">
                      <p className="text-white font-medium">Best regards,</p>
                      <p className="text-gray-500 text-sm mt-1">The Hiring Team</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <button 
                  onClick={declineOffer}
                  className="px-8 py-3.5 rounded-xl font-bold text-sm text-gray-400 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:text-white transition-all w-full sm:w-auto"
                >
                  Decline Offer
                </button>
                <button 
                  onClick={acceptOffer}
                  className="px-10 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transform hover:-translate-y-0.5 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  Accept Offer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
