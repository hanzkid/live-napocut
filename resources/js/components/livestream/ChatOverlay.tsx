import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/product";

interface ChatOverlayProps {
  messages: ChatMessage[];
}

export const ChatOverlay = ({ messages }: ChatOverlayProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-2 max-h-32 overflow-y-auto scrollbar-hide"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="flex items-start gap-2 animate-slide-up"
        >
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="text-white text-xs font-bold">
              {msg.isSystem && "💬 "}
              {msg.username}
            </span>
            <span className="text-white text-xs">{msg.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
