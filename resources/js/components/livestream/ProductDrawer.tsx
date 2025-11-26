import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Product } from "@/types/livestream";
import { useState, useEffect, useRef } from "react";

interface ProductDrawerProps {
    products: Product[];
    onProductClick: (product: Product) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PRODUCTS_PER_PAGE = 10;

export const ProductDrawer = ({
    products,
    onProductClick,
    open,
    onOpenChange,
}: ProductDrawerProps) => {
    const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Reset visible count when drawer opens
    useEffect(() => {
        if (open) {
            setVisibleCount(PRODUCTS_PER_PAGE);
        }
    }, [open]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrollPercentage =
            (target.scrollTop + target.clientHeight) / target.scrollHeight;

        // Load more when scrolled to 80% of the content
        if (scrollPercentage > 0.8 && visibleCount < products.length) {
            setVisibleCount((prev) =>
                Math.min(prev + PRODUCTS_PER_PAGE, products.length)
            );
        }
    };

    const visibleProducts = products.slice(0, visibleCount);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="!max-h-[70vh] flex flex-col">
                <DrawerHeader className="flex-shrink-0">
                    <DrawerTitle>Products</DrawerTitle>
                </DrawerHeader>
                <div
                    ref={scrollContainerRef}
                    className="overflow-y-auto p-4 space-y-3 flex-1"
                    onScroll={handleScroll}
                >
                    {visibleProducts.map((product) => (
                        console.log(product),
                        <div
                            key={product.id}
                            className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-accent transition-colors"
                            onClick={() => onProductClick(product)}
                        >
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-base font-bold">
                                    {product.plain_price}
                                </p>
                            </div>
                        </div>
                    ))}
                    {visibleCount < products.length && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                            Scroll for more products...
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};
