import { useState, useEffect } from "react";
import { useParticipants, VideoTrack } from "@livekit/components-react";
import { Eye, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/livestream/ui/badge";
import { Button } from "@/components/livestream/ui/button";
import { Track, RemoteParticipant } from "livekit-client";

export const WebRTCVideoPlayer = () => {
    const participants = useParticipants();
    const liveViewers = participants.length;

    // Find the broadcaster (first remote participant with video track)
    const broadcaster = participants.find(
        (p): p is RemoteParticipant =>
            p instanceof RemoteParticipant && p.videoTrackPublications.size > 0
    );

    // Get the video track publication
    const videoPublication = broadcaster?.videoTrackPublications.values().next().value;

    // Mute state - start muted to comply with autoplay policies
    const [isMuted, setIsMuted] = useState(() => {
        // Check localStorage for user preference, default to muted
        const saved = localStorage.getItem('livestream-muted');
        return saved !== null ? saved === 'true' : true;
    });

    // Sync muted state with localStorage
    useEffect(() => {
        localStorage.setItem('livestream-muted', String(isMuted));
    }, [isMuted]);

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div className="relative w-full h-full bg-black">
            {/* Video Element */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                {broadcaster && videoPublication ? (
                    <VideoTrack
                        trackRef={{
                            participant: broadcaster,
                            source: Track.Source.Camera,
                            publication: videoPublication,
                        }}
                        className="w-full h-full object-cover"
                        muted={isMuted}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        <p className="text-white text-lg">Waiting for stream...</p>
                    </div>
                )}
            </div>

            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
                <div className="flex items-center justify-between gap-2">
                    {/* Mute/Unmute Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white"
                        onClick={toggleMute}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? (
                            <VolumeX className="w-5 h-5" />
                        ) : (
                            <Volume2 className="w-5 h-5" />
                        )}
                    </Button>

                    {/* Live Viewers Badge */}
                    <Badge
                        variant="secondary"
                        className="bg-black/60 hover:bg-black/60 text-white px-3 py-1.5 gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        {liveViewers.toLocaleString()}
                    </Badge>
                </div>
            </div>
        </div>
    );
};
