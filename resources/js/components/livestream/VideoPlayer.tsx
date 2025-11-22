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

  // Unmute prompt state
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

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
        });
        // Show unmute prompt if video is muted
        if (isMuted) {
          setShowUnmutePrompt(true);
        }
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
        });
        // Show unmute prompt if video is muted
        if (isMuted) {
          setShowUnmutePrompt(true);
        }
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
    // Hide unmute prompt when user unmutes
    if (isMuted) {
      setShowUnmutePrompt(false);
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

      {/* Unmute Prompt Overlay */}
      {showUnmutePrompt && isMuted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-sm mx-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => setShowUnmutePrompt(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <VolumeX className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Enable Sound</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unmute to hear the livestream audio and enjoy the full experience!
                </p>
              </div>
              <Button
                onClick={toggleMute}
                className="w-full"
                size="lg"
              >
                <Volume2 className="w-5 h-5 mr-2" />
                Unmute Now
              </Button>
            </div>
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
