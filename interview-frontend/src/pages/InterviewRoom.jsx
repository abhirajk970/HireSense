import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import VideoPlayer from '../components/VideoPlayer';
import EditorView from '../components/EditorView';
import Sidebar from '../components/Sidebar';
import FeedbackForm from '../components/FeedbackForm';

const SERVER_URL = 'http://localhost:5100'; // Interview Microservice (Socket.io)
const API_URL = 'http://localhost:5000/api/interviews'; // Main Backend REST

export default function InterviewRoom() {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const userRole = searchParams.get('role') || 'candidate'; // ?role=interviewer or ?role=candidate
    
    // WebRTC and Media States
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    
    // Editor States
    const [code, setCode] = useState('// Welcome to the collaborative editor\n');
    const [language, setLanguage] = useState('javascript');
    
    // Interview State
    const [interviewEnded, setInterviewEnded] = useState(false);
    const [interviewBlocked, setInterviewBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    
    // Notes state (lifted so it carries from Sidebar -> FeedbackForm)
    const [interviewNotes, setInterviewNotes] = useState('');

    const socketRef = useRef();
    const peerRef = useRef();
    const localStreamRef = useRef();

    // Check if interview can be joined (one-time access)
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await axios.get(`${API_URL}/${roomId}/status`);
                const interview = res.data;
                if (interview.status === 'Completed') {
                    setInterviewBlocked(true);
                    setBlockReason('This interview has already been completed. You cannot rejoin.');
                } else if (interview.status === 'Expired') {
                    setInterviewBlocked(true);
                    setBlockReason('This interview session has expired (1-hour window exceeded).');
                } else if (interview.status === 'Cancelled') {
                    setInterviewBlocked(true);
                    setBlockReason('This interview has been cancelled.');
                }
            } catch (err) {
                // If 404, the roomId doesn't match any interview — allow anyway for dev
                console.warn("Could not verify interview status:", err.message);
            }
        };
        checkStatus();
    }, [roomId]);

    // Setup Socket and Local Media
    useEffect(() => {
        if (interviewBlocked) return;
        
        socketRef.current = io(SERVER_URL);

        const initMediaProcess = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                localStreamRef.current = stream;

                const userId = localStorage.getItem('userId') || Math.random().toString(36).substring(7);
                socketRef.current.emit('join-room', roomId, userId);
            } catch (err) {
                console.error("Failed to get local stream", err);
                alert("Camera/Microphone access required");
            }
        };

        if (!localStreamRef.current) {
            initMediaProcess();
        }

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (peerRef.current) peerRef.current.close();
        };
    }, [roomId, interviewBlocked]);

    // WebRTC Signaling Handlers
    useEffect(() => {
        if (!socketRef.current || interviewBlocked) return;

        socketRef.current.on('user-connected', async (userId, socketId) => {
            const peer = createPeer(socketId);
            peerRef.current = peer;
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socketRef.current.emit('offer', offer, roomId, socketId);
        });

        socketRef.current.on('offer', async (offer, senderSocketId) => {
            const peer = createPeer(senderSocketId);
            peerRef.current = peer;
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socketRef.current.emit('answer', answer, roomId, senderSocketId);
        });

        socketRef.current.on('answer', async (answer) => {
            if (peerRef.current) {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socketRef.current.on('ice-candidate', async (candidate) => {
            if (peerRef.current && candidate) {
                try {
                    await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch(e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        });

        socketRef.current.on('code-update', (newCode, lang) => {
            setCode(newCode);
            if (lang) setLanguage(lang);
        });

        socketRef.current.on('language-change', (lang) => {
            setLanguage(lang);
        });
    }, [roomId, interviewBlocked]);

    const createPeer = (targetSocketId) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peer.addTrack(track, localStreamRef.current);
            });
        }

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice-candidate', event.candidate, roomId, targetSocketId);
            }
        };

        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        return peer;
    };

    // Editor Actions
    const handleCodeChange = (newValue) => {
        setCode(newValue);
        socketRef.current.emit('code-change', newValue, roomId, language);
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        socketRef.current.emit('language-change', newLang, roomId);
    };

    // Screen Share Toggle
    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                replaceVideoTrack(stream.getVideoTracks()[0]);
                setLocalStream(stream);
                localStreamRef.current = stream;
                setIsScreenSharing(false);
            } catch(e) { console.error(e) }
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = stream.getVideoTracks()[0];
                replaceVideoTrack(screenTrack);
                screenTrack.onended = async () => { toggleScreenShare(); };
                const audioTracks = localStreamRef.current.getAudioTracks();
                if (audioTracks.length > 0) stream.addTrack(audioTracks[0]);
                setLocalStream(stream);
                setIsScreenSharing(true);
            } catch(e) { console.error("Screen sharing failed", e) }
        }
    };

    const replaceVideoTrack = (newTrack) => {
        if (peerRef.current) {
            const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(newTrack);
        }
    };

    const toggleAudio = () => {
        if(localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if(audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if(localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if(videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // Blocked screen
    if (interviewBlocked) {
        return (
            <div className="h-screen flex items-center justify-center bg-black font-sans">
                <div className="bg-[#15151a] border border-white/[0.08] rounded-2xl p-10 max-w-md text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-sm text-gray-400">{blockReason}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-black overflow-hidden font-sans relative">
            {interviewEnded && <FeedbackForm roomId={roomId} role={userRole} initialNotes={interviewNotes} />}
            
            {/* Sidebar — ONLY for Interviewer */}
            {userRole === 'interviewer' && (
                <Sidebar 
                    notes={interviewNotes} 
                    onNotesChange={setInterviewNotes} 
                    onEndInterview={() => setInterviewEnded(true)} 
                />
            )}

            {/* Main Area: Editor */}
            <div className="flex-1 flex overflow-hidden">
                <EditorView 
                    code={code} 
                    language={language} 
                    onCodeChange={handleCodeChange} 
                    onLanguageChange={handleLanguageChange}
                />
            </div>

            {/* Right Panel: Videos + Controls */}
            <div className="w-80 border-l border-white/[0.05] bg-[#0d0d12] flex flex-col items-center p-4 gap-4 overflow-y-auto">
                <VideoPlayer stream={remoteStream} isLocal={false} name={userRole === 'interviewer' ? 'Candidate' : 'Interviewer'} isScreenSharing={false} />
                <VideoPlayer stream={localStream} isLocal={true} name="You" isScreenSharing={isScreenSharing} />
                
                <div className="flex flex-wrap items-center justify-center gap-3 w-full bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl mt-auto">
                    {/* Mic Toggle — Green when on, Red when muted */}
                    <button onClick={toggleAudio} className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${isMuted ? 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30' : 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}`}>
                        {isMuted ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-2a5 5 0 01-10 0H3a7.001 7.001 0 006 6.93V17H6v2h8v-2h-3v-2.07z" clipRule="evenodd"/></svg>
                        )}
                    </button>
                    
                    {/* Camera Toggle — Green when on, Red when off */}
                    <button onClick={toggleVideo} className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30' : 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}`}>
                        {isVideoOff ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        )}
                    </button>
                    
                    {/* Screen Share Toggle */}
                    <button onClick={toggleScreenShare} className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${isScreenSharing ? 'bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-white/[0.06] hover:bg-white/[0.1]'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </button>

                    {/* End Interview button for Candidate view (since they don't have the Sidebar) */}
                    {userRole === 'candidate' && (
                        <button onClick={() => setInterviewEnded(true)} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white transition-all shadow-lg shadow-red-500/30">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"/></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
