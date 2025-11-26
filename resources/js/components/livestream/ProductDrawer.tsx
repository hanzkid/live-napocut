import { Check } from "lucide-react";
import { Button } from "@/components/livestream/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Product } from "@/types/livestream";
import { useState } from "react";

interface ProductDrawerProps {
    products: Product[];
    onProductClick: (product: Product) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ProductDrawer = ({
    products,
    onProductClick,
    open,
    onOpenChange,
}: ProductDrawerProps) => {
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
        new Set()
    );

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

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="!max-h-[70vh] flex flex-col">
                <DrawerHeader className="flex-shrink-0">
                    <DrawerTitle>Products</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                    {products.map((product) => (
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
                                    ${product.formatted_price || product.price.toLocaleString()}
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className={`w-8 h-8 rounded-full flex-shrink-0 transition-all ${selectedProducts.has(product.id)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                                    }`}
                                onClick={(e) => toggleSelect(product.id, e)}
                            >
                                <Check className="w-5 h-5" />
                            </Button>
                        </div>
                    ))}
                </div>
            </DrawerContent>
        </Drawer>
    );
};
