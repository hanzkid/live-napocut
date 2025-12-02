import { X, ChevronLeft, ChevronRight, ShoppingCart, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/livestream/ui/button";
import { Badge } from "@/components/livestream/ui/badge";
import { Separator } from "@/components/livestream/ui/separator";
import { Product } from "@/types/product";
import { useState } from "react";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [product.image];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background animate-slide-up overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold truncate pr-4">Product Details</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image Section */}
      <div className="relative aspect-square bg-muted">
        <img
          src={images[currentImageIndex]}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
              onClick={prevImage}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === currentImageIndex
                    ? "bg-primary w-8"
                    : "bg-primary/30 w-2"
                    }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Details */}
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">
                Pre-owned
              </Badge>
              <h1 className="text-2xl font-bold leading-tight">
                {product.name}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {product.formatted_price || `$${product.price.toLocaleString()}`}
            </span>
            {!product.formatted_price && (
              <span className="text-muted-foreground">.00</span>
            )}
          </div>
        </div>

        <Separator />

        {product.description && (
          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <div
              className="text-sm prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            <span>Free shipping on orders over $100</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span>30-day return policy</span>
          </div>
        </div>

        <div className="sticky bottom-0 pt-4 pb-2 bg-background">
          <Button
            className="w-full h-14 text-lg font-semibold"
            size="lg"
            asChild
          >
            <a href={product.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-5 w-5" />
              Lihat Produk
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};
