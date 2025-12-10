import { useState, useEffect, useRef } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { VideoPlayer } from "@/components/livestream/VideoPlayer";
import { useChat } from "@livekit/components-react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

type DiscountCode = {
    code: string;
    description: string | null;
    valid_start_date: string | null;
    valid_end_date: string | null;
};

type Product = {
    id: number;
    name: string;
    price: number;
    formatted_price: string;
    plain_price: number;
    description: string | null;
    link: string | null;
    category: string | null;
    image: string | null;
    images: string[];
};

type ChatMessage = {
    id: string;
    message: string;
    from?: {
        identity: string;
    };
    timestamp: number;
};

const MonitoringChatInput = ({ livestreamId, userName }: { livestreamId: number; userName: string }) => {
    const [message, setMessage] = useState("");
    const { send } = useChat();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            // Send via LiveKit for real-time delivery
            await send(message);

            // Also persist to database
            try {
                await fetch('/api/livestream-messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
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

            setMessage("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send message..."
                className="flex-1 h-9"
            />
            <Button
                type="submit"
                size="sm"
                disabled={!message.trim()}
                className="h-9 px-3"
            >
                <Send className="w-4 h-4" />
            </Button>
        </form>
    );
};

const ChatDisplay = ({ livestreamId }: { livestreamId: number }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { chatMessages } = useChat();
    const [persistedMessages, setPersistedMessages] = useState<ChatMessage[]>([]);
    const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);

    // Load chat history on mount
    useEffect(() => {
        const loadChatHistory = async () => {
            try {
                const response = await fetch(`/api/livestream-messages/${livestreamId}`);
                const data = await response.json();
                const messages = data.map((msg: any) => ({
                    id: `db-${msg.id}`,
                    message: msg.message,
                    from: { identity: msg.user_name },
                    timestamp: new Date(msg.sent_at).getTime(),
                }));
                setPersistedMessages(messages);
            } catch (error) {
                console.error('Failed to load chat history:', error);
            }
        };

        loadChatHistory();
    }, [livestreamId]);

    // Merge LiveKit and persisted messages, remove duplicates
    useEffect(() => {
        const messageMap = new Map<string, ChatMessage>();

        // Add persisted messages
        persistedMessages.forEach(msg => {
            messageMap.set(msg.message + msg.from?.identity + msg.timestamp, msg); // Use timestamp in key for uniqueness
        });

        // Add LiveKit messages (they override if same content and sender, but different timestamp)
        chatMessages.forEach(msg => {
            const key = msg.message + msg.from?.identity + msg.timestamp;
            if (!messageMap.has(key)) { // Only add if not already present
                messageMap.set(key, msg as ChatMessage);
            }
        });

        const merged = Array.from(messageMap.values()).sort((a, b) => a.timestamp - b.timestamp);
        setAllMessages(merged);
    }, [chatMessages, persistedMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [allMessages]);

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
            {allMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">No messages yet</p>
                </div>
            ) : (
                allMessages.map((msg) => (
                    <div key={msg.id} className="flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold">
                                {msg.from?.identity || "System"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <span className="text-sm text-foreground">{msg.message}</span>
                    </div>
                ))
            )}
        </div>
    );
};

const MonitoringContent = (props: {
    livekit_ws_url: string;
    livekit_token: string | null;
    room_name: string | null;
    hls_url: string | null;
    is_active: boolean;
    products: Product[];
    discountCodes: DiscountCode[];
    livestream_id: number | null;
    user_name: string;
}) => {
    const [streamEnded, setStreamEnded] = useState(false);

    // Set up Laravel Echo connection for livestream status updates
    useEffect(() => {
        if (typeof window === "undefined" || !window.Echo) {
            return;
        }

        const channel = window.Echo.channel("livestream-status");

        channel.listen(".ended", (data: { message: string }) => {
            setStreamEnded(true);
        });

        // Cleanup on unmount
        return () => {
            window.Echo.leave("livestream-status");
        };
    }, []);

    if (!props.is_active || !props.livekit_token || streamEnded) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {streamEnded ? "Livestream Ended" : "No Active Livestream"}
                    </h2>
                    <p className="text-gray-600">
                        {streamEnded
                            ? "The livestream has ended."
                            : "There is no active livestream at the moment."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            key={props.livekit_token}
            serverUrl={props.livekit_ws_url}
            token={props.livekit_token}
            connect={true}
            className="flex h-full gap-4 p-4"
        >
            {/* Left Column - Products & Discount Codes */}
            <div className="w-[450px] flex flex-col gap-4 overflow-y-auto">
                {/* Products Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Products</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[50vh] overflow-y-auto">
                        {props.products.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No products</p>
                        ) : (
                            props.products.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                >
                                    {product.image && (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold truncate">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm font-medium text-primary">
                                            {product.formatted_price}
                                        </p>
                                        {product.category && (
                                            <p className="text-xs text-muted-foreground">{product.category}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Discount Codes Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Discount Codes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {props.discountCodes.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No discount codes</p>
                        ) : (
                            props.discountCodes.map((code, index) => (
                                <div
                                    key={index}
                                    className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-100 dark:border-blue-900"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono font-bold text-primary">
                                            {code.code}
                                        </span>
                                    </div>
                                    {code.description && (
                                        <p className="text-xs text-muted-foreground">{code.description}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Center Column - Video Player */}
            <div className="flex-1 relative bg-gray-900 flex items-center justify-center rounded-lg overflow-hidden">
                {/* Livestream Title */}
                {props.room_name && (
                    <div className="absolute top-4 left-0 right-0 z-30 flex justify-center">
                        <h1 className="text-lg font-semibold text-white text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                            {props.room_name}
                        </h1>
                    </div>
                )}

                {/* Video Player Container - 9:16 aspect ratio */}
                <div className="relative w-full h-full max-w-[56.25vh] bg-black">
                    <VideoPlayer hlsUrl={props.hls_url} />
                </div>
            </div>

            {/* Right Column - Chat */}
            <div className="w-96 flex flex-col overflow-hidden">
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>Live Chat</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0">
                        {/* Chat Messages */}
                        <div className="flex-1">
                            <ChatDisplay livestreamId={props.livestream_id || 0} />
                        </div>

                        {/* Chat Input */}
                        <div className="border-t p-3">
                            <MonitoringChatInput
                                livestreamId={props.livestream_id || 0}
                                userName={props.user_name}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </LiveKitRoom>
    );
};

const Index = (props: {
    livekit_ws_url: string;
    livekit_token: string | null;
    room_name: string | null;
    hls_url: string | null;
    is_active: boolean;
    products: Product[];
    discountCodes?: DiscountCode[];
    livestream_id: number | null;
    user_name: string;
}) => {

    return (
        <AppLayout>
            <Head title="Monitoring Livestream" />
            <div className="h-[calc(100vh-4rem)] overflow-hidden">
                <MonitoringContent
                    livekit_ws_url={props.livekit_ws_url}
                    livekit_token={props.livekit_token}
                    room_name={props.room_name}
                    hls_url={props.hls_url}
                    is_active={props.is_active}
                    products={props.products}
                    discountCodes={props.discountCodes || []}
                    livestream_id={props.livestream_id}
                    user_name={props.user_name}
                />
            </div>
        </AppLayout>
    );
};

export default Index;
