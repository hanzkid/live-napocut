import {
    Drawer,
    DrawerContent,
    DrawerHeader,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Product } from "@/types/livestream";
import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Copy, Check } from "lucide-react";

interface DiscountCode {
    code: string;
    description: string | null;
    valid_start_date: string | null;
    valid_end_date: string | null;
}

interface ProductDrawerProps {
    products: Product[];
    discountCodes?: DiscountCode[];
    onProductClick: (product: Product) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PRODUCTS_PER_PAGE = 10;

export const ProductDrawer = ({
    products,
    discountCodes = [],
    onProductClick,
    open,
    onOpenChange,
}: ProductDrawerProps) => {
    const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

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

    // Filter products by selected category and search query
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Filter by category
        if (selectedCategory !== "All") {
            filtered = filtered.filter((product) => product.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((product) =>
                product.name.toLowerCase().includes(query) ||
                product.description?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [products, selectedCategory, searchQuery]);

    // Reset visible count and search when drawer opens or filters change
    useEffect(() => {
        if (open) {
            setVisibleCount(PRODUCTS_PER_PAGE);
            setSearchQuery("");
        }
    }, [open]);

    useEffect(() => {
        setVisibleCount(PRODUCTS_PER_PAGE);
    }, [selectedCategory, searchQuery]);

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
                <DrawerHeader className="flex-shrink-0 pb-3 px-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </DrawerHeader>

                {/* Discount Code Cards */}
                {discountCodes.length > 0 && (
                    <div className="px-4 pb-3 flex-shrink-0">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {discountCodes.map((discount) => (
                                <div
                                    key={discount.code}
                                    className="flex-shrink-0 cursor-pointer group"
                                    onClick={() => handleCopyCode(discount.code)}
                                >
                                    <div className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg px-3 py-2 hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <span className="font-mono font-bold text-sm block mb-0.5">
                                                    {discount.code}
                                                </span>
                                                <p 
                                                    className="text-[10px] opacity-90"
                                                    dangerouslySetInnerHTML={{ __html: discount.description || '' }}
                                                />
                                            </div>
                                            <div className="flex-shrink-0 bg-white/20 rounded p-1">
                                                {copiedCode === discount.code ? (
                                                    <Check className="h-3 w-3" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category Filter Badges */}
                {categories.length > 1 && (
                    <div className="px-4 pb-2 flex-shrink-0">
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
                    className="overflow-y-auto pt-2 px-4 space-y-3 flex-1"
                    onScroll={handleScroll}
                >
                    {visibleProducts.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center gap-3 cursor-pointer group rounded-lg hover:bg-accent transition-colors"
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
