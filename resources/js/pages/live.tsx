import { router } from "@inertiajs/react";
import { useState } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { VideoPlayer } from "@/components/livestream/VideoPlayer";
import { ChatOverlay } from "@/components/livestream/ChatOverlay";
import { ChatInput } from "@/components/livestream/ChatInput";
import { ProductCarousel } from "@/components/livestream/ProductCarousel";
import { ProductModal } from "@/components/livestream/ProductModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product, ChatMessage } from "@/types/livestream";

const products: Product[] = [
  {
    id: "1",
    name: "Pre-owned Hermes Birkin 30 Bleu Izmir Shiny Niloticus Crocodile Palladium Hardware",
    price: 50500,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80",
    ],
    description: "Pre-owned Hermes Birkin 30 Bleu Izmir Shiny Niloticus Crocodile Palladium Hardware"
  },
  {
    id: "2",
    name: "Chanel Classic Flap Bag Medium Black Lambskin Gold Hardware",
    price: 8500,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
    ],
    description: "Chanel Classic Flap Bag Medium Black Lambskin Gold Hardware"
  },
  {
    id: "3",
    name: "Louis Vuitton Neverfull MM Monogram Canvas",
    price: 1890,
    image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80",
    ],
    description: "Louis Vuitton Neverfull MM Monogram Canvas"
  },
];
const Index = (props: {
  livekit_ws_url: string;
  livekit_token: string | null;
  room_name: string | null;
  hls_url: string | null;
  is_active: boolean;
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewerName, setViewerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const livekit_token = props.livekit_token;
  const showNameDialog = !livekit_token && props.is_active;

  const handleNameSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!viewerName.trim()) {
      setNameError("Please enter your name to continue.");
      return;
    }

    setNameError(null);
    setIsSubmitting(true);

    router.post(
      "/live",
      { name: viewerName.trim() },
      {
        preserveScroll: true,
        onError: (errors) => {
          if (errors.name) {
            setNameError(errors.name);
          }
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {!props.is_active ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">No Active Stream</h2>
            <p className="text-white/60">There is no livestream currently active. Please check back later.</p>
          </div>
        </div>
      ) : livekit_token ? (
        <LiveKitRoom
          serverUrl={props.livekit_ws_url}
          token={livekit_token}
          connect={true}
          className="relative w-full h-full"
        >
          {/* Video Player */}
          <VideoPlayer hlsUrl={props.hls_url} />

          {/* Chat Overlay */}
          <div className="absolute bottom-44 left-4 right-4 z-20">
            <ChatOverlay />
          </div>

          {/* Chat Input */}
          <div className="absolute bottom-24 left-0 right-0 z-20">
            <ChatInput />
          </div>

          {/* Product Carousel */}
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <ProductCarousel
              products={products}
              onProductClick={setSelectedProduct}
            />
          </div>

          {/* Product Modal */}
          {selectedProduct && (
            <ProductModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
            />
          )}
        </LiveKitRoom>
      ) : null}

      {showNameDialog && (
        <Dialog open>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Join the live stream</DialogTitle>
              <DialogDescription>
                Let us know your name so we can personalize your experience before
                connecting you to the room.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleNameSubmit}>
              <div className="space-y-2">
                <Label htmlFor="viewer-name">Name</Label>
                <Input
                  id="viewer-name"
                  placeholder="Alex Kim"
                  value={viewerName}
                  onChange={(event) => setViewerName(event.target.value)}
                  aria-invalid={Boolean(nameError)}
                  autoComplete="name"
                  required
                />
                {nameError && (
                  <p className="text-sm text-destructive">{nameError}</p>
                )}
              </div>
              <DialogFooter className="flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Requesting access…" : "Join the stream"}
                </Button>
                {isSubmitting && (
                  <p className="text-sm text-muted-foreground text-center">
                    Hang tight while we generate your access token.
                  </p>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Index;
