import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/livestream/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndexRoute, store as productsStoreRoute, update as productsUpdateRoute, destroy as productsDestroyRoute, importFromUrl as productsImportFromUrlRoute } from '@/routes/products';
import { destroy as deleteImageRoute } from '@/routes/product-images';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Plus, Pencil, Trash2, X, ImagePlus, Link, ExternalLink } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

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
    created_at: string;
};

type Category = {
    id: number;
    name: string;
};

interface ProductsIndexProps {
    products: ProductRecord[];
    categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: productsIndexRoute().url,
    },
];

export default function ProductsIndex({ products = [], categories = [] }: ProductsIndexProps) {
    const [rows, setRows] = useState<ProductRecord[]>(products);
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: 'created_at',
            desc: true,
        },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [importUrl, setImportUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        description: string;
        price: string;
        link: string;
        category_id: string;
        images: File[];
    }>({
        name: '',
        description: '',
        price: '',
        link: '',
        category_id: '',
        images: [],
    });

    useEffect(() => {
        setRows(products);
    }, [products]);

    const columns: ColumnDef<ProductRecord>[] = [
        {
            accessorKey: 'name',
            header: () => <span className="text-sm font-semibold">Product</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    {/* Image Gallery Preview */}
                    <div className="flex -space-x-2">
                        {row.original.images.slice(0, 3).map((image, index) => (
                            <div
                                key={image.id}
                                className="relative h-14 w-14 rounded-lg border-2 border-background overflow-hidden shadow-sm hover:z-10 transition-transform hover:scale-110"
                                style={{ zIndex: 3 - index }}
                            >
                                <img
                                    src={image.url}
                                    alt={`${row.original.name} ${index + 1}`}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ))}
                        {row.original.images.length === 0 && (
                            <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center border-2 border-background">
                                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                        {row.original.images.length > 3 && (
                            <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-background text-xs font-semibold text-primary">
                                +{row.original.images.length - 3}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate">{row.original.name}</span>
                        {row.original.description && (
                            <span className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                {row.original.description.replace(/<[^>]*>/g, '')}
                            </span>
                        )}
                    </div>
                </div>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'price',
            header: () => <span className="text-sm font-semibold">Price</span>,
            cell: ({ row }) => (
                <span className="font-semibold text-lg">{row.original.price}</span>
            ),
        },
        {
            accessorKey: 'link',
            header: () => <span className="text-sm font-semibold">Link</span>,
            cell: ({ row }) => (
                row.original.link ? (
                    <a
                        href={row.original.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        <ExternalLink className="h-3 w-3" />
                        View
                    </a>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )
            ),
        },
        {
            id: 'actions',
            header: () => <span className="text-sm font-semibold">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row.original);
                        }}
                        className="h-8 w-8"
                        title="Edit product"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row.original.id);
                        }}
                        className="h-8 w-8 hover:text-destructive"
                        title="Delete product"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data: rows,
        columns,
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const filteredCount = table.getFilteredRowModel().rows.length;
    const totalCount = rows.length;
    const nameFilterValue = (table.getColumn('name')?.getFilterValue() as string) ?? '';

    const handleCreate = () => {
        setEditingProduct(null);
        reset();
        setImagePreviews([]);
        setIsDialogOpen(true);
    };

    const handleEdit = (product: ProductRecord) => {
        setEditingProduct(product);
        setData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            link: product.link || '',
            category_id: product.category?.id.toString() || '',
            images: [],
        });
        setImagePreviews(product.images.map(img => img.url));
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setProductToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!productToDelete) return;

        router.delete(productsDestroyRoute({ product: productToDelete }).url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Product deleted successfully');
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
            },
            onError: () => {
                toast.error('Failed to delete product');
            },
        });
    };

    const handleDeleteImage = (imageId: number) => {
        if (confirm('Are you sure you want to delete this image?')) {
            router.delete(deleteImageRoute({ image: imageId }).url, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Image deleted successfully');
                    if (editingProduct) {
                        setEditingProduct({
                            ...editingProduct,
                            images: editingProduct.images.filter(img => img.id !== imageId),
                        });
                        setImagePreviews(prev => prev.filter((_, idx) =>
                            editingProduct.images[idx]?.id !== imageId
                        ));
                    }
                },
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setData('images', [...data.images, ...files]);

            // Create previews
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
        const existingImagesCount = editingProduct?.images.length || 0;
        const newImageIndex = index - existingImagesCount;

        if (newImageIndex >= 0) {
            setData('images', data.images.filter((_, i) => i !== newImageIndex));
            setImagePreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', data.price);
        formData.append('link', data.link);
        if (data.category_id) {
            formData.append('category_id', data.category_id);
        }

        data.images.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
        });

        if (editingProduct) {
            formData.append('_method', 'PUT');
            router.post(productsUpdateRoute({ product: editingProduct.id }).url, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                    setImagePreviews([]);
                    toast.success('Product updated successfully');
                },
            });
        } else {
            router.post(productsStoreRoute().url, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                    setImagePreviews([]);
                    toast.success('Product created successfully');
                },
            });
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        reset();
        setImagePreviews([]);
        setEditingProduct(null);
    };

    const handleImportFromUrl = () => {
        setImportUrl('');
        setIsImportDialogOpen(true);
    };

    const handleImportSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsImporting(true);

        const formData = new FormData();
        formData.append('url', importUrl);

        router.post(productsImportFromUrlRoute().url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsImportDialogOpen(false);
                setImportUrl('');
                toast.success('Product imported successfully');
            },
            onError: (errors) => {
                const errorMessage = errors.url || 'Failed to import product';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsImporting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <header className="flex flex-col gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">
                        Manage products that can be featured in livestreams.
                    </p>
                </header>

                <Card className="shadow-none border-0">
                    <CardContent className="p-0">
                        <div className="pb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <Input
                                className="w-full sm:w-[300px]"
                                placeholder="Search products..."
                                value={nameFilterValue}
                                onChange={(event) =>
                                    table.getColumn('name')?.setFilterValue(event.target.value)
                                }
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" className="w-full sm:w-auto" onClick={handleImportFromUrl}>
                                    <Link className="size-4" />
                                    Create from Link
                                </Button>
                                <Button className="w-full sm:w-auto" onClick={handleCreate}>
                                    <Plus className="size-4" />
                                    Create Product
                                </Button>
                            </div>
                        </div>
                        <div className="overflow-hidden">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                                        <button
                                                            type="button"
                                                            onClick={header.column.getToggleSortingHandler()}
                                                            className="flex items-center gap-2 text-sm font-semibold text-foreground"
                                                        >
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext(),
                                                            )}
                                                            <ArrowUpDown className="size-4 text-muted-foreground" />
                                                        </button>
                                                    ) : (
                                                        flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext(),
                                                        )
                                                    )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>

                                <TableBody>
                                    {table.getRowModel().rows.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.visit(`/products/${row.original.id}`)}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-32 text-center text-sm text-muted-foreground"
                                            >
                                                No products found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 border-t border-sidebar-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredCount} of {totalCount} product
                            {totalCount === 1 ? '' : 's'}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? 'Update product information and images.' : 'Add a new product with images.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleSubmit}>
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
                            <RichTextEditor
                                value={data.description}
                                onChange={(value) => setData('description', value)}
                                placeholder="Product description with formatting support..."
                                disabled={processing}
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
                                                if (editingProduct && index < editingProduct.images.length) {
                                                    handleDeleteImage(editingProduct.images[index].id);
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

                        <DialogFooter className="gap-2 sm:space-x-2">
                            <Button type="button" variant="ghost" onClick={closeDialog} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : editingProduct ? 'Update Product' : 'Create Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Import from URL Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Product from URL</DialogTitle>
                        <DialogDescription>
                            Enter a product URL to automatically import product details and images.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleImportSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="import-url">Product URL</Label>
                            <Input
                                id="import-url"
                                type="url"
                                placeholder="https://example.com/products/123"
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                disabled={isImporting}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                The URL should contain product information in JSON-LD format.
                            </p>
                        </div>

                        <DialogFooter className="gap-2 sm:space-x-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsImportDialogOpen(false)}
                                disabled={isImporting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isImporting}>
                                {isImporting ? 'Importing…' : 'Import Product'}
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
                            Are you sure you want to delete this product? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
