import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Eye } from "lucide-react";
import { Button } from "@/components/livestream/ui/button";
import { Badge } from "@/components/livestream/ui/badge";

interface VideoPlayerProps {
  videoUrl?: string;
}

export const VideoPlayer = ({ videoUrl }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liveViewers, setLiveViewers] = useState(1247);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Simulate live viewer count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers((prev) => {
        const change = Math.floor(Math.random() * 20) - 10;
        return Math.max(1000, Math.min(2000, prev + change));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Element - Using placeholder for demo */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80"
        >
          {videoUrl && <source src={videoUrl} type="video/mp4" />}
        </video>
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

      {/* Center Play Button */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Button
            variant="ghost"
            size="icon"
            className="w-20 h-20 rounded-full bg-white/90 hover:bg-white text-black"
            onClick={togglePlay}
          >
            <Play className="w-10 h-10 ml-1" fill="currentColor" />
          </Button>
        </div>
      )}

      {/* Bottom Timeline */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent z-10">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-medium min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <span className="text-white text-sm font-medium min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
