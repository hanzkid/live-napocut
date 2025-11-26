import { router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { VideoPlayer } from "@/components/livestream/VideoPlayer";
import { ChatOverlay } from "@/components/livestream/ChatOverlay";
import { ChatInput } from "@/components/livestream/ChatInput";
import { ProductDrawer } from "@/components/livestream/ProductDrawer";
import { ProductBottomSheet } from "@/components/livestream/ProductBottomSheet";
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
import { ShoppingBag } from "lucide-react";
import { Product, ChatMessage } from "@/types/livestream";

const Index = (props: {
  livekit_ws_url: string;
  livekit_token: string | null;
  room_name: string | null;
  hls_url: string | null;
  is_active: boolean;
  is_guest: boolean;
  products: Product[];
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [viewerName, setViewerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);

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
        onSuccess: () => {
          setShowNameDialog(false);
        },
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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setProductSheetOpen(true);
    setDrawerOpen(false); // Close the product list drawer
  };

  const handleCloseProductSheet = () => {
    setProductSheetOpen(false);
    setSelectedProduct(null);
    setDrawerOpen(true); // Reopen the product list drawer
  };

  const handleChatInputClick = () => {
    // Show name dialog if user is a guest
    if (props.is_guest && props.is_active) {
      setShowNameDialog(true);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {props.is_active && props.livekit_token ? (
        <LiveKitRoom
          serverUrl={props.livekit_ws_url}
          token={props.livekit_token}
          connect={true}
          className="relative w-full h-full"
        >
          {/* Video Player */}
          <VideoPlayer hlsUrl={props.hls_url} />

          {/* Chat Overlay */}
          <div className="absolute bottom-20 left-4 right-4 z-20">
            <ChatOverlay />
          </div>

          {/* Chat Input */}
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <ChatInput
              drawerTrigger={
                <Button
                  type="button"
                  size="icon"
                  className="h-9 w-9 bg-white/90 hover:bg-white text-black rounded-full flex-shrink-0"
                  onClick={() => setDrawerOpen(true)}
                >
                  <ShoppingBag className="w-4 h-4" />
                </Button>
              }
              onInputClick={props.is_guest ? handleChatInputClick : undefined}
            />
          </div>

          {/* Product Drawer */}
          <ProductDrawer
            products={props.products}
            onProductClick={handleProductClick}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
          />

          {/* Product Bottom Sheet */}
          <ProductBottomSheet
            product={selectedProduct}
            open={productSheetOpen}
            onOpenChange={handleCloseProductSheet}
          />
        </LiveKitRoom>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">No Active Stream</h2>
            <p className="text-white/60">There is no livestream currently active. Please check back later.</p>
          </div>
        </div>
      )}

      {showNameDialog && (
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set your display name</DialogTitle>
              <DialogDescription>
                Enter your name to participate in the chat and interact with others.
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
                  {isSubmitting ? "Joining…" : "Join chat"}
                </Button>
                {isSubmitting && (
                  <p className="text-sm text-muted-foreground text-center">
                    Setting up your chat access...
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
