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
import { applyThemeFront } from "@/hooks/use-appearance";

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
  livestream_id: number | null;
  user_name: string;
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [viewerName, setViewerName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [validDiscountCodes, setValidDiscountCodes] = useState<DiscountCode[]>([]);
  const [streamEnded, setStreamEnded] = useState(false);
  const [products, setProducts] = useState<Product[]>(props.products);

  useEffect(() => {
    if (props.discountCodes) {
      setValidDiscountCodes(props.discountCodes);
    }
  }, [props.discountCodes]);

  useEffect(() => {
    setProducts(props.products);
  }, [props.products]);

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

    return () => {
      window.Echo.leave('discount-codes');
    };
  }, [props.is_active]);

  useEffect(() => {
    if (!props.is_active) {
      return;
    }

    if (typeof window === 'undefined' || !window.Echo) {
      return;
    }

    const channel = window.Echo.channel('products');

    channel
      .listen('.updated', async () => {
        try {
          const response = await fetch('/api/products');
          if (response.ok) {
            const data = await response.json();
            setProducts(data.products);
          }
        } catch (error) {
          console.error('Failed to fetch updated products:', error);
        }
      });

    return () => {
      window.Echo.leave('products');
    };
  }, [props.is_active]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Echo) {
      return;
    }

    const channel = window.Echo.channel('livestream-status');

    channel
      .listen('.ended', (data: { message: string }) => {
          setStreamEnded(true);
      });

    return () => {
      window.Echo.leave('livestream-status');
    };
  }, []);

  // apply theme to light
  useEffect(() => {
    applyThemeFront('light');
  }, []);

  useEffect(() => {
    if (props.is_guest && !props.livekit_token) {
      const savedName = localStorage.getItem("livestream_viewer_name");

      if (savedName && props.is_active) {
        router.post(
          "/live",
          { name: savedName },
          {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
            },
          }
        );
      } else if (!savedName) {
        setShowNameDialog(true);
      }
    }
  }, [props.is_guest, props.livekit_token, props.is_active]);


  const handleNameSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!viewerName.trim()) {
      setNameError("Masukkan nama kamu dulu untuk lanjut.");
      return;
    }

    setNameError(null);
    setIsSubmitting(true);

    localStorage.setItem("livestream_viewer_name", viewerName.trim());

    router.post(
      "/live",
      { name: viewerName.trim() },
      {
        preserveScroll: true,
        preserveState: false,
        onSuccess: () => {
          setShowNameDialog(false);
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
    if (props.is_guest && props.is_active) {
      setShowNameDialog(true);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-gray-950">
      <div className="relative w-full h-full max-w-md mx-auto bg-black">
        {props.is_active && props.livekit_token && !streamEnded ? (
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
                livestreamId={props.livestream_id || undefined}
              />
            </div>

            {/* Product Drawer */}
            <ProductDrawer
              products={products}
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
              <h2 className="text-2xl font-bold text-white mb-2">
                {streamEnded ? "Live Shopping Sudah Berakhir" : "Belum Ada Live Saat Ini"}
              </h2>
              <p className="text-white/60">
                {streamEnded
                  ? "Live shopping sudah selesai, terima kasih sudah menonton!"
                  : "Belum ada live shopping sekarang. Coba cek lagi nanti, ya!"}
              </p>
            </div>
          </div>
        )}
      </div>

      {showNameDialog && (
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Masukkan Nama Kamu</DialogTitle>
              <DialogDescription>
                Masukkan nama kamu untuk ikutan chat dan belanja bareng.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleNameSubmit}>
              <div className="space-y-2">
                <Label htmlFor="viewer-name">Nama</Label>
                <Input
                  id="viewer-name"
                  placeholder="Budi Santoso"
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
                  {isSubmitting ? "Sedang bergabung…" : "Gabung Chat"}
                </Button>
                {isSubmitting && (
                  <p className="text-sm text-muted-foreground text-center">
                    Menyiapkan chat kamu...
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
