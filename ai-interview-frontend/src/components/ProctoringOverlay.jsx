import React, { useEffect } from 'react';

export default function ProctoringOverlay({ socketRef, roomId, videoRef }) {
    useEffect(() => {
        // Monitor tab switches
        const handleVisChange = () => {
            if (document.hidden && socketRef.current) {
                socketRef.current.emit('tab-switch', roomId);
            }
        };
        document.addEventListener('visibilitychange', handleVisChange);

        // Periodic frame capture for proctoring (every 15 seconds)
        const interval = setInterval(() => {
            if (!videoRef?.current || !socketRef?.current) return;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 160;
                canvas.height = 120;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, 160, 120);
                
                // Simple check: if the frame is completely black, no face
                const imageData = ctx.getImageData(0, 0, 160, 120);
                let totalBrightness = 0;
                for (let i = 0; i < imageData.data.length; i += 4) {
                    totalBrightness += imageData.data[i] + imageData.data[i+1] + imageData.data[i+2];
                }
                const avgBrightness = totalBrightness / (imageData.data.length / 4 * 3);
                
                if (avgBrightness < 10) {
                    socketRef.current.emit('proctor-violation', roomId, 'camera_blocked', 'Camera appears to be blocked or covered');
                }
            } catch (e) {
                // Canvas errors are non-critical
            }
        }, 15000);

        return () => {
            document.removeEventListener('visibilitychange', handleVisChange);
            clearInterval(interval);
        };
    }, [socketRef, roomId, videoRef]);

    return (
        <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5 bg-red-500/15 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-full border border-red-500/20 backdrop-blur-sm pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            PROCTORED
        </div>
    );
}
