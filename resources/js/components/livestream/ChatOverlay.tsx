import { useEffect, useRef } from "react";
import { useChat } from "@livekit/components-react";

export const ChatOverlay = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { chatMessages } = useChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-2 max-h-32 overflow-y-auto scrollbar-hide"
    >
      {chatMessages.map((msg) => (
        <div
          key={msg.id}
          className="flex items-start gap-2 animate-slide-up"
        >
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="text-white text-xs font-bold">
              {msg.from?.identity || "System"}
            </span>
            <span className="text-white text-xs">{msg.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
