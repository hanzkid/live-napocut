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
import { Send, Copy, Check, ExternalLink, Tag } from "lucide-react";

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
                placeholder="Ketik pesan..."
                className="flex-1"
            />
            <Button
                type="submit"
                size="sm"
                disabled={!message.trim()}
            >
                <Send className="w-4 h-4" />
            </Button>
        </form>
    );
};

const ChatDisplay = ({ livestreamId, userName }: { livestreamId: number; userName: string }) => {
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
            messageMap.set(msg.message + msg.from?.identity + msg.timestamp, msg);
        });

        // Add LiveKit messages
        chatMessages.forEach(msg => {
            const key = msg.message + msg.from?.identity + msg.timestamp;
            if (!messageMap.has(key)) {
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
            className="flex-1 overflow-y-auto p-4 space-y-3"
        >
            {allMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Belum ada pesan</p>
                    <p className="text-xs mt-1">Mulai percakapan dengan penonton</p>
                </div>
            ) : (
                allMessages.map((msg) => {
                    const isAdmin = msg.from?.identity === userName;
                    return (
                        <div
                            key={msg.id}
                            className={`flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                            <div className="flex items-baseline gap-2">
                                <span className={`text-xs font-semibold ${isAdmin ? 'text-primary' : 'text-foreground'}`}>
                                    {msg.from?.identity || "System"}
                                    {isAdmin && (
                                        <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                            Admin
                                        </span>
                                    )}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className={`
                                px-3 py-2 rounded-lg text-sm max-w-[85%]
                                ${isAdmin
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground'
                                }
                            `}>
                                {msg.message}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

const DiscountCodeCard = ({ code }: { code: DiscountCode }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-3 bg-muted/50 rounded-lg border hover:bg-muted transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono font-bold text-foreground">
                            {code.code}
                        </span>
                    </div>
                    {code.description && (
                        <p className="text-xs text-muted-foreground">
                            {code.description}
                        </p>
                    )}
                    {code.valid_end_date && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Berlaku hingga {new Date(code.valid_end_date).toLocaleDateString('id-ID')}
                        </p>
                    )}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-8 w-8 p-0"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </Button>
            </div>
        </div>
    );
};

const ProductCard = ({ product }: { product: Product }) => {
    return (
        <div className="flex gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-muted transition-colors group">
            {/* Product Image */}
            {product.image && (
                <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Product Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-1">
                        {product.name}
                    </h3>
                    {product.category && (
                        <span className="inline-block text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-full mb-1">
                            {product.category}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-bold text-primary">
                        {product.formatted_price}
                    </p>
                    {product.link && (
                        <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </a>
                    )}
                </div>
            </div>
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
    const [activeTab, setActiveTab] = useState<'products' | 'discounts'>('products');

    // Set up Laravel Echo connection for livestream status updates
    useEffect(() => {
        if (typeof window === "undefined" || !window.Echo) {
            return;
        }

        const channel = window.Echo.channel("livestream-status");

        channel.listen(".ended", (data: { message: string }) => {
            setStreamEnded(true);
        });

        return () => {
            window.Echo.leave("livestream-status");
        };
    }, []);

    if (!props.is_active || !props.livekit_token || streamEnded) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">
                        {streamEnded ? "Livestream Berakhir" : "Tidak Ada Livestream Aktif"}
                    </h2>
                    <p className="text-muted-foreground">
                        {streamEnded
                            ? "Livestream telah berakhir. Terima kasih!"
                            : "Belum ada livestream yang sedang berlangsung."}
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
            <div className="w-[380px] flex flex-col overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-4">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'products'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Produk
                        <span className="ml-1.5 text-xs">({props.products.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('discounts')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'discounts'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Kode Diskon
                        <span className="ml-1.5 text-xs">({props.discountCodes.length})</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {activeTab === 'products' ? (
                        <div className="space-y-2">
                            {props.products.length === 0 ? (
                                <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
                                    <Tag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">Belum ada produk</p>
                                </div>
                            ) : (
                                props.products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {props.discountCodes.length === 0 ? (
                                <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
                                    <Tag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">Belum ada kode diskon</p>
                                </div>
                            ) : (
                                props.discountCodes.map((code, index) => (
                                    <DiscountCodeCard key={index} code={code} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Center Column - Video Player */}
            <div className="flex-1 relative bg-black flex items-center justify-center rounded-lg overflow-hidden">
                {/* Livestream Title */}
                {props.room_name && (
                    <div className="absolute top-4 left-0 right-0 z-30 flex justify-center px-4">
                        <h1 className="text-lg font-semibold text-white text-center drop-shadow-lg bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
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
            <div className="w-[360px] flex flex-col overflow-hidden">
                <Card className="flex-1 flex flex-col">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Chat Langsung
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-hidden">
                            <ChatDisplay livestreamId={props.livestream_id || 0} userName={props.user_name} />
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
