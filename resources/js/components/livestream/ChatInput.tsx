import { useState } from "react";
import { useChat } from "@livekit/components-react";
import { Input } from "@/components/livestream/ui/input";
import { Button } from "@/components/livestream/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  drawerTrigger?: React.ReactNode;
  onInputClick?: () => void;
  livestreamId?: number;
}

export const ChatInput = ({ drawerTrigger, onInputClick, livestreamId }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { send } = useChat();

  let userName = localStorage.getItem("livestream_viewer_name") || "Viewer";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Send via LiveKit for real-time delivery
      await send(message);

      // Also persist to database if livestreamId and userName are provided
      if (livestreamId && userName) {
        try {
          await fetch('/api/livestream-messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              livestream_id: livestreamId,
              user_name: userName,
              message: message.trim(),
            }),
          });
        } catch (error) {
          console.error('Failed to persist message:', error);
        }
      }

      setMessage("");
    }
  };

  const handleInputClick = () => {
    if (onInputClick) {
      onInputClick();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2.5 bg-transparent">
      {drawerTrigger}
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onClick={handleInputClick}
        placeholder="Send message..."
        className="flex-1 h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:border-white/50 focus-visible:bg-white/15 rounded-full"
      />
      <Button
        type="submit"
        size="icon"
        className="h-9 w-9 bg-white/90 hover:bg-white text-black rounded-full"
        disabled={!message.trim()}
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};
