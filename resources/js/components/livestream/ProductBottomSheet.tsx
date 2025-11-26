import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/livestream/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from "@/components/ui/drawer";
import { Product } from "@/types/livestream";
import { useState } from "react";

interface ProductBottomSheetProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ProductBottomSheet = ({
    product,
    open,
    onOpenChange,
}: ProductBottomSheetProps) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!product) return null;

    const images = product.images || [product.image];

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="!max-h-[85vh] flex flex-col">
                <DrawerHeader className="flex-shrink-0 relative">
                    <DrawerTitle className="text-left pr-8">{product.name}</DrawerTitle>
                    <DrawerClose asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4 rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DrawerClose>
                </DrawerHeader>

                <div className="overflow-y-auto flex-1">
                    {/* Image Gallery */}
                    <div className="relative">
                        <div className="aspect-square bg-white">
                            <img
                                src={images[currentImageIndex]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Image Indicators */}
                        {images.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {images.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                                ? "bg-white w-6"
                                                : "bg-white/50"
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Swipe Navigation */}
                        {images.length > 1 && (
                            <>
                                {currentImageIndex > 0 && (
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                                    >
                                        ←
                                    </button>
                                )}
                                {currentImageIndex < images.length - 1 && (
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                                    >
                                        →
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="p-4 space-y-4">
                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-primary">
                                {product.plain_price || product.formatted_price}
                            </p>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm text-muted-foreground">
                                    Description
                                </h3>
                                <div
                                    className="text-sm prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Bottom CTA */}
                <div className="flex-shrink-0 p-4 border-t bg-background">
                    <Button
                        asChild
                        className="w-full h-12 text-base font-semibold"
                        size="lg"
                    >
                        <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                        >
                            Buy Now
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
