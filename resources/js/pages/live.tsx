import { router } from "@inertiajs/react";
import { useState, useEffect } from "react";
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

const Index = (props: {
  livekit_ws_url: string;
  livekit_token: string | null;
  room_name: string | null;
  hls_url: string | null;
  is_active: boolean;
  products: Product[];
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

  // Handle product modal with browser history
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    // Push a new history state when opening modal
    window.history.pushState({ modalOpen: true }, '');
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    // Remove the history state if it exists
    if (window.history.state?.modalOpen) {
      window.history.back();
    }
  };

  // Listen for back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Close modal when back button is pressed
      if (selectedProduct) {
        setSelectedProduct(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProduct]);

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
              products={props.products}
              onProductClick={handleProductClick}
            />
          </div>

          {/* Product Modal */}
          {selectedProduct && (
            <ProductModal
              product={selectedProduct}
              onClose={handleCloseModal}
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
