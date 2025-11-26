import { useEffect, useRef, useState } from "react";
import { useParticipants } from "@livekit/components-react";
import Hls from "hls.js";
import { Eye, Volume2, VolumeX, X } from "lucide-react";
import { Badge } from "@/components/livestream/ui/badge";
import { Button } from "@/components/livestream/ui/button";

interface VideoPlayerProps {
  hlsUrl: string | null;
}

export const VideoPlayer = ({ hlsUrl }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const participants = useParticipants();
  const liveViewers = participants.length;

  // Mute state - start muted to comply with autoplay policies
  const [isMuted, setIsMuted] = useState(() => {
    // Check localStorage for user preference, default to muted
    const saved = localStorage.getItem('livestream-muted');
    return saved !== null ? saved === 'true' : true;
  });

  // Play prompt state
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    // Ensure video starts muted for autoplay
    video.muted = isMuted;

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((error) => {
          console.error("Error playing video:", error);
          // Show play prompt if autoplay is blocked
          setShowPlayPrompt(true);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Network error, trying to recover...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Media error, trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal error, cannot recover");
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari, which has native HLS support
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((error) => {
          console.error("Error playing video:", error);
          // Show play prompt if autoplay is blocked
          setShowPlayPrompt(true);
        });
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  // Sync muted state with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      localStorage.setItem('livestream-muted', String(isMuted));
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handlePlay = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = false; // Unmute since user has already provided input
      setIsMuted(false); // Update state
      video.play()
        .then(() => {
          setShowPlayPrompt(false);
        })
        .catch((error) => {
          console.error("Still cannot play video:", error);
        });
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Element */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        {hlsUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={isMuted}
            controls={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white text-lg">Waiting for stream...</p>
          </div>
        )}
      </div>

      {/* Click to Play Prompt (when autoplay is blocked) */}
      {showPlayPrompt && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 z-30 cursor-pointer"
          onClick={handlePlay}
        >
          <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-110">
            <svg className="w-16 h-16 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}



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
