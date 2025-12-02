import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndexRoute, update as productsUpdateRoute } from '@/routes/products';
import { destroy as deleteImageRoute } from '@/routes/product-images';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { ImagePlus, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { Editor } from "@/components/blocks/editor-x/editor"
import { SerializedEditorState } from "lexical"

type ProductImage = {
    id: number;
    url: string;
    order: number;
};

type ProductRecord = {
    id: number;
    name: string;
    description: string | null;
    price: string;
    link: string | null;
    category: { id: number; name: string } | null;
    images: ProductImage[];
};

type Category = {
    id: number;
    name: string;
};

interface ProductsEditProps {
    product: ProductRecord;
    categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: productsIndexRoute().url,
    },
    {
        title: 'Edit Product',
        href: '#',
    },
];

// Simple helper: just store HTML as-is, Lexical will parse it
// We'll pass the HTML directly to the editor and let it handle parsing

// Helper to parse price (remove currency formatting)
const parsePrice = (priceString: string): string => {
    return priceString
        .replace(/Rp\s*/gi, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
};

export default function ProductsEdit({ product, categories = [] }: ProductsEditProps) {
    const [imagePreviews, setImagePreviews] = useState<string[]>(product.images.map(img => img.url));
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editorState, setEditorState] = useState<SerializedEditorState | undefined>(undefined)
    
    // Helper to convert Lexical state to HTML
    const lexicalStateToHtml = (state: SerializedEditorState | undefined): string => {
        return  '';
    };

    const parsedPrice = parsePrice(product.price);
    
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        description: string;
        price: string;
        link: string;
        category_id: string;
        images: File[];
    }>({
        name: product.name,
        description: product.description || '',
        price: parsedPrice,
        link: product.link || '',
        category_id: product.category?.id.toString() || '',
        images: [],
    });

    // HTML is passed directly to Editor component, no conversion needed

    const handleDeleteImage = (imageId: number) => {
        if (confirm('Are you sure you want to delete this image?')) {
            router.delete(deleteImageRoute({ image: imageId }).url, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Image deleted successfully');
                    setImagePreviews(prev => prev.filter((_, idx) =>
                        product.images[idx]?.id !== imageId
                    ));
                },
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setData('images', [...data.images, ...files]);

            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeNewImage = (index: number) => {
        const existingImagesCount = product.images.length;
        const newImageIndex = index - existingImagesCount;

        if (newImageIndex >= 0) {
            setData('images', data.images.filter((_, i) => i !== newImageIndex));
            setImagePreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const descriptionHtml = editorState 
            ? lexicalStateToHtml(editorState) 
            : data.description;

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', descriptionHtml);
        formData.append('price', data.price);
        formData.append('link', data.link);
        if (data.category_id) {
            formData.append('category_id', data.category_id);
        }

        data.images.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
        });

        formData.append('_method', 'PUT');
        router.post(productsUpdateRoute({ product: product.id }).url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Product updated successfully');
                router.visit(productsIndexRoute().url);
            },
            onError: () => {
                toast.error('Failed to update product');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Product" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <header className="flex flex-col gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">Edit Product</h1>
                    <p className="text-muted-foreground">
                        Update product information and images.
                    </p>
                </header>

                <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="product-name">Name</Label>
                                <Input
                                    id="product-name"
                                    placeholder="Product name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    disabled={processing}
                                    required
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="product-description">Description</Label>
                                <Editor
                                    
                                    editorSerializedState={editorState}
                                    onSerializedChange={(value) => setEditorState(value)}
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="product-price">Price</Label>
                                    <Input
                                        id="product-price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        disabled={processing}
                                        required
                                    />
                                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="product-link">Link (Optional)</Label>
                                    <Input
                                        id="product-link"
                                        type="url"
                                        placeholder="https://example.com"
                                        value={data.link}
                                        onChange={(e) => setData('link', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.link && <p className="text-sm text-destructive">{errors.link}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="product-category">Category (Optional)</Label>
                                <Select
                                    value={data.category_id}
                                    onValueChange={(value) => setData('category_id', value)}
                                    disabled={processing}
                                >
                                    <SelectTrigger id="product-category">
                                        <SelectValue placeholder="No category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Images</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    if (index < product.images.length) {
                                                        handleDeleteImage(product.images[index].id);
                                                    } else {
                                                        removeNewImage(index);
                                                    }
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-32 border-2 border-dashed rounded flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                                        disabled={processing}
                                    >
                                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Add Image</span>
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                                {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => router.visit(productsIndexRoute().url)} 
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating…' : 'Update Product'}
                                </Button>
                            </div>
                        </form>
            </div>
        </AppLayout>
    );
}

