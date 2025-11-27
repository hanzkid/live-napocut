import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/livestream";
import { useState, useEffect, useRef, useMemo } from "react";

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
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Extract unique categories from products
    const categories = useMemo(() => {
        const uniqueCategories = new Set<string>();
        products.forEach((product) => {
            if (product.category) {
                uniqueCategories.add(product.category);
            }
        });
        return ["All", ...Array.from(uniqueCategories).sort()];
    }, [products]);

    // Filter products by selected category
    const filteredProducts = useMemo(() => {
        if (selectedCategory === "All") {
            return products;
        }
        return products.filter((product) => product.category === selectedCategory);
    }, [products, selectedCategory]);

    // Reset visible count when drawer opens or category changes
    useEffect(() => {
        if (open) {
            setVisibleCount(PRODUCTS_PER_PAGE);
        }
    }, [open, selectedCategory]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrollPercentage =
            (target.scrollTop + target.clientHeight) / target.scrollHeight;

        // Load more when scrolled to 80% of the content
        if (scrollPercentage > 0.8 && visibleCount < filteredProducts.length) {
            setVisibleCount((prev) =>
                Math.min(prev + PRODUCTS_PER_PAGE, filteredProducts.length)
            );
        }
    };

    const visibleProducts = filteredProducts.slice(0, visibleCount);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="!max-h-[70vh] flex flex-col">
                <DrawerHeader className="flex-shrink-0">
                    <DrawerTitle>Products</DrawerTitle>
                </DrawerHeader>

                {/* Category Filter Badges */}
                {categories.length > 1 && (
                    <div className="px-4 pb-3 flex-shrink-0">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map((category) => (
                                <Badge
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    className="cursor-pointer hover:bg-primary/90 transition-colors"
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div
                    ref={scrollContainerRef}
                    className="overflow-y-auto p-4 space-y-3 flex-1"
                    onScroll={handleScroll}
                >
                    {visibleProducts.map((product) => (
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
                    {visibleCount < filteredProducts.length && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                            Scroll for more products...
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};
