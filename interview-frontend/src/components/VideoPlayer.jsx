import React, { useEffect, useRef } from "react";

export default function VideoPlayer({ stream, isLocal, name, isScreenSharing }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative rounded-xl overflow-hidden bg-black/50 border border-white/[0.05] shadow-lg group w-full aspect-video">
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted={isLocal} 
                className={`w-full h-full object-cover ${isScreenSharing && !isLocal ? 'object-contain' : ''} ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`} 
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white font-bold text-sm bg-black/40 px-2 py-1 rounded backdrop-blur-md">
                    {name}
                </span>
            </div>
            {!stream && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-500 font-medium text-sm">No Stream</span>
                </div>
            )}
        </div>
    );
}
