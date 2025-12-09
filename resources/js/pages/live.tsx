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

type DiscountCode = {
  code: string;
  description: string | null;
  valid_start_date: string | null;
  valid_end_date: string | null;
};

const Index = (props: {
  livekit_ws_url: string;
  livekit_token: string | null;
  room_name: string | null;
  hls_url: string | null;
  is_active: boolean;
  is_guest: boolean;
  products: Product[];
  discountCodes?: DiscountCode[];
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [viewerName, setViewerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [validDiscountCodes, setValidDiscountCodes] = useState<DiscountCode[]>([]);


  // Initialize discount codes from props
  useEffect(() => {
    if (props.discountCodes) {
      setValidDiscountCodes(props.discountCodes);
    }
  }, [props.discountCodes]);

  // Set up Laravel Echo connection for real-time discount code updates
  useEffect(() => {
    if (!props.is_active) {
      return;
    }

    if (typeof window === 'undefined' || !window.Echo) {
      return;
    }

    const channel = window.Echo.channel('discount-codes');

    channel
      .listen('.updated', (data: { discountCodes: DiscountCode[] }) => {
        setValidDiscountCodes(data.discountCodes);
      });

    // Cleanup on unmount
    return () => {
      window.Echo.leave('discount-codes');
    };
  }, [props.is_active]);

  // Check localStorage for saved name and auto-submit if user is guest
  useEffect(() => {
    const savedName = localStorage.getItem("livestream_viewer_name");

    // If user is a guest and has a saved name, automatically submit it
    // This works even if they already have a Guest_xxx token
    if (props.is_guest && savedName && props.is_active) {
      router.post(
        "/live",
        { name: savedName },
        {
          preserveScroll: true,
          preserveState: false,
          onSuccess: () => {
            router.reload({ only: ['livekit_token', 'is_guest'] });
          },
        }
      );
    }
  }, []); // Run only once on mount


  const handleNameSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!viewerName.trim()) {
      setNameError("Please enter your name to continue.");
      return;
    }

    setNameError(null);
    setIsSubmitting(true);

    // Save name to localStorage
    localStorage.setItem("livestream_viewer_name", viewerName.trim());

    router.post(
      "/live",
      { name: viewerName.trim() },
      {
        preserveScroll: true,
        preserveState: false,
        onSuccess: () => {
          setShowNameDialog(false);
          // Soft reload to get new token without hard refresh
          router.reload({ only: ['livekit_token', 'is_guest'] });
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
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black">
      {props.is_active && props.livekit_token ? (
        <LiveKitRoom
          key={props.livekit_token}
          serverUrl={props.livekit_ws_url}
          token={props.livekit_token}
          connect={true}
          className="relative w-full h-full"
        >
          {/* Livestream Title */}
          {props.room_name && (
            <div className="absolute top-4 left-0 right-0 z-30 flex justify-center">
              <h1 className="text-lg font-semibold text-white text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {props.room_name}
              </h1>
            </div>
          )}

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
            discountCodes={validDiscountCodes}
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
