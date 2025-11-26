import { useState } from "react";
import { useChat } from "@livekit/components-react";
import { Input } from "@/components/livestream/ui/input";
import { Button } from "@/components/livestream/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  drawerTrigger?: React.ReactNode;
}

export const ChatInput = ({ drawerTrigger }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { send } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      await send(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2.5 bg-transparent">
      {drawerTrigger}
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
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
