import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/livestream/ui/button";
import { Product } from "@/types/product";
import { useState } from "react";

interface ProductCarouselProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export const ProductCarousel = ({ products, onProductClick }: ProductCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const toggleSelect = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const currentProduct = products[currentIndex];

  return (
    <div className="relative flex items-center gap-2 bg-black/80 backdrop-blur-sm p-2 sm:p-3 rounded-t-2xl">
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
        onClick={prevProduct}
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>

      <div
        className="flex-1 flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
        onClick={() => onProductClick(currentProduct)}
      >
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white">
          <img
            src={currentProduct.image}
            alt={currentProduct.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-white text-xs sm:text-sm font-medium truncate">
            {currentProduct.name.split(" ").slice(0, 6).join(" ")}...
          </p>
          <p className="text-white text-sm sm:text-base font-bold">
            ${currentProduct.formatted_price || currentProduct.price.toLocaleString()}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 transition-all ${selectedProducts.has(currentProduct.id)
            ? "bg-white text-black"
            : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          onClick={(e) => toggleSelect(currentProduct.id, e)}
        >
          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
        onClick={nextProduct}
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
    </div>
  );
};
