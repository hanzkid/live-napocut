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
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/livestream/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndexRoute, create as productsCreateRoute, edit as productsEditRoute, destroy as productsDestroyRoute, importFromUrl as productsImportFromUrlRoute, toggleVisibility as productsToggleVisibilityRoute, show as productsShowRoute } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, router, Link } from '@inertiajs/react';
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
import { ArrowUpDown, Plus, Pencil, Trash2, ImagePlus, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';


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
    is_show: boolean;
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
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [togglingVisibilityIds, setTogglingVisibilityIds] = useState<number[]>([]);
    const [importUrl, setImportUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);

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
            accessorKey: 'is_show',
            header: () => <span className="text-sm font-semibold">Visible</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={row.original.is_show}
                        disabled={togglingVisibilityIds.includes(row.original.id)}
                        onCheckedChange={() => {
                            const id = row.original.id;
                            setTogglingVisibilityIds((prev) =>
                                prev.includes(id) ? prev : [...prev, id],
                            );

                            router.patch(
                                productsToggleVisibilityRoute({ product: id }).url,
                                {},
                                {
                                    preserveScroll: true,
                                    onFinish: () => {
                                        setTogglingVisibilityIds((prev) =>
                                            prev.filter((currentId) => currentId !== id),
                                        );
                                    },
                                },
                            );
                        }}
                    />
                    {togglingVisibilityIds.includes(row.original.id) && (
                        <Spinner className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
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
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.visit(productsShowRoute({ product: row.original.id }).url);
                        }}
                        title="View product details"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>
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

    const handleEdit = (product: ProductRecord) => {
        router.visit(productsEditRoute({ product: product.id }).url);
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
                                    <LinkIcon className="size-4" />
                                    Create from Link
                                </Button>
                                <Button className="w-full sm:w-auto" asChild>
                                    <Link href={productsCreateRoute().url}>
                                        <Plus className="size-4" />
                                        Create Product
                                    </Link>
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
                                            className="hover:bg-muted/50"
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
