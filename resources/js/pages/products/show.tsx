import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndexRoute, destroy as deleteImageRoute } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ExternalLink, Pencil, Trash2, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

type ProductImage = {
    id: number;
    url: string;
    order: number;
};

type Product = {
    id: number;
    name: string;
    description: string;
    price: string;
    link: string | null;
    images: ProductImage[];
    created_at: string;
    updated_at: string;
};

interface ProductShowProps {
    product: Product;
}

export default function ProductShow({ product: initialProduct }: ProductShowProps) {
    const [product, setProduct] = useState(initialProduct);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleteImageDialogOpen, setIsDeleteImageDialogOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, put, processing, errors, reset } = useForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        link: product.link || '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Products',
            href: productsIndexRoute().toString(),
        },
        {
            title: product.name,
        },
    ];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    };

    const handleEdit = () => {
        setData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            link: product.link || '',
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/products/${product.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Product updated successfully');
                setIsEditDialogOpen(false);
                reset();
                router.reload({ only: ['product'] });
            },
            onError: () => {
                toast.error('Failed to update product');
            },
        });
    };

    const handleDelete = () => {
        router.delete(`/products/${product.id}`, {
            onSuccess: () => {
                toast.success('Product deleted successfully');
                router.visit(productsIndexRoute().toString());
            },
            onError: () => {
                toast.error('Failed to delete product');
            },
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingImage(true);
        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('images[]', file);
        });

        try {
            await router.post(`/products/${product.id}/images`, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Images uploaded successfully');
                    router.reload({ only: ['product'] });
                },
                onError: () => {
                    toast.error('Failed to upload images');
                },
                onFinish: () => {
                    setIsUploadingImage(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
            });
        } catch (error) {
            toast.error('Failed to upload images');
            setIsUploadingImage(false);
        }
    };

    const handleDeleteImage = (imageId: number) => {
        setImageToDelete(imageId);
        setIsDeleteImageDialogOpen(true);
    };

    const confirmDeleteImage = () => {
        if (!imageToDelete) return;

        router.delete(`/product-images/${imageToDelete}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Image deleted successfully');
                if (currentImageIndex >= product.images.length - 1) {
                    setCurrentImageIndex(Math.max(0, product.images.length - 2));
                }
                setIsDeleteImageDialogOpen(false);
                setImageToDelete(null);
                router.reload({ only: ['product'] });
            },
            onError: () => {
                toast.error('Failed to delete image');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={product.name} />
            <div className="flex flex-1 flex-col gap-8 p-6 max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
                        <p className="text-3xl font-bold text-primary mt-3">{product.price}</p>
                    </div>
                    <div className="flex gap-2">
                        {product.link && (
                            <Button variant="outline" asChild>
                                <a href={product.link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Link
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </header>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {product.images.length > 0 ? (
                            <>
                                {/* Main Image */}
                                <div className="relative aspect-square bg-muted/30 rounded-xl overflow-hidden group">
                                    <img
                                        src={product.images[currentImageIndex].url}
                                        alt={`${product.name} ${currentImageIndex + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                    {/* Delete Current Image Button */}
                                    <button
                                        onClick={() => handleDeleteImage(product.images[currentImageIndex].id)}
                                        className="absolute top-3 right-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground p-2.5 rounded-lg transition-all shadow-lg z-10 text-white"
                                        title="Delete this image"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                    {product.images.length > 1 && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={prevImage}
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={nextImage}
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </Button>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium">
                                                {currentImageIndex + 1} / {product.images.length}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Thumbnail Gallery */}
                                {product.images.length > 1 && (
                                    <div className="grid grid-cols-6 gap-2">
                                        {product.images.map((image, index) => (
                                            <button
                                                key={image.id}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`aspect-square rounded-lg overflow-hidden transition-all ${index === currentImageIndex
                                                    ? 'ring-2 ring-primary ring-offset-2'
                                                    : 'opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <img
                                                    src={image.url}
                                                    alt={`${product.name} thumbnail ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="aspect-square bg-muted/30 rounded-xl flex items-center justify-center">
                                <p className="text-muted-foreground">No images available</p>
                            </div>
                        )}

                        {/* Upload Button */}
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingImage}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploadingImage ? 'Uploading...' : 'Upload Images'}
                            </Button>
                        </div>
                    </div>

                    {/* Product Details */}
                    <div>
                        {/* Description */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Description</h2>
                            {product.description ? (
                                <div
                                    className="prose prose-sm max-w-none text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                />
                            ) : (
                                <p className="text-muted-foreground">No description available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>
                                Update product information
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <RichTextEditor
                                    value={data.description}
                                    onChange={(value) => setData('description', value)}
                                    placeholder="Product description..."
                                    disabled={processing}
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-price">Price (IDR)</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    step="0.01"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-link">External Link (optional)</Label>
                                <Input
                                    id="edit-link"
                                    type="url"
                                    placeholder="https://..."
                                    value={data.link}
                                    onChange={(e) => setData('link', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.link && <p className="text-sm text-destructive">{errors.link}</p>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{product.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Image Confirmation Dialog */}
            <Dialog open={isDeleteImageDialogOpen} onOpenChange={setIsDeleteImageDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Image</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this image? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteImageDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteImage}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
