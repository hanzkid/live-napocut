import { useTracks, useParticipants } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Eye } from "lucide-react";
import { Badge } from "@/components/livestream/ui/badge";

export const VideoPlayer = () => {
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: false,
  });
  const participants = useParticipants();
  const liveViewers = participants.length;

  // Get the first camera track (broadcaster's video)
  const videoTrack = tracks.find((track) => track.source === Track.Source.Camera);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Element */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        {videoTrack ? (
          <video
            ref={(el) => {
              if (el && videoTrack.publication.track) {
                videoTrack.publication.track.attach(el);
              }
            }}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
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
