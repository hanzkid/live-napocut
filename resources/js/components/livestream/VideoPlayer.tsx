import { useEffect, useRef } from "react";
import { useParticipants } from "@livekit/components-react";
import Hls from "hls.js";
import { Eye } from "lucide-react";
import { Badge } from "@/components/livestream/ui/badge";

interface VideoPlayerProps {
  hlsUrl: string | null;
}

export const VideoPlayer = ({ hlsUrl }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const participants = useParticipants();
  const liveViewers = participants.length;

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
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

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
            muted
            controls={false}
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
        <div className="flex items-center justify-end gap-2">
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
