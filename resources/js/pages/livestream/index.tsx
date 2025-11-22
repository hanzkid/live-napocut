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
import { index as livestreamIndexRoute, store as livestreamStoreRoute } from '@/routes/livestream';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
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
import { ArrowUpDown, Copy, Plus, CheckCircle2, Check, ChevronsUpDown, X } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

type ProductOption = {
    id: number;
    name: string;
    price: string;
    image: string | null;
};

type LivestreamRecord = {
    id: number;
    title: string | null;
    ws_url: string | null;
    stream_key: string | null;
    created_at: string;
    updated_at: string;
    products?: ProductOption[];
};

interface LivestreamIndexProps {
    streams: LivestreamRecord[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Livestreams',
        href: livestreamIndexRoute().url,
    },
];

const columns: ColumnDef<LivestreamRecord>[] = [
    {
        accessorKey: 'title',
        header: () => <span className="text-sm font-semibold">Title</span>,
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium text-foreground">
                    {row.original.title?.trim() || 'Untitled stream'}
                </span>
                <span className="text-sm text-muted-foreground">ID #{row.original.id}</span>
            </div>
        ),
        enableSorting: true,
    },
    {
        accessorKey: 'ws_url',
        header: () => <span className="text-sm font-semibold">Websocket URL</span>,
        cell: ({ row }) =>
            row.original.ws_url ? (
                <div className="flex items-center gap-2 group">
                    <span className="font-mono text-xs text-primary">{row.original.ws_url}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                            navigator.clipboard.writeText(row.original.ws_url || '');
                            toast.success('WebSocket URL copied to clipboard');
                        }}
                        title="Copy to clipboard"
                    >
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            ) : (
                <span className="text-sm text-muted-foreground">—</span>
            ),
    },
    {
        accessorKey: 'stream_key',
        header: () => <span className="text-sm font-semibold">Stream key</span>,
        cell: ({ row }) => (
            <div className="flex items-center gap-2 group">
                <span className="font-mono text-xs">{maskStreamKey(row.original.stream_key)}</span>
                {row.original.stream_key && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                            navigator.clipboard.writeText(row.original.stream_key || '');
                            toast.success('Stream key copied to clipboard');
                        }}
                        title="Copy to clipboard"
                    >
                        <Copy className="h-3 w-3" />
                    </Button>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'created_at',
        header: () => <span className="text-sm font-semibold">Created</span>,
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">{formatDateTime(row.original.created_at)}</span>
        ),
        enableSorting: true,
    },
];

export default function LivestreamIndex({ streams = [] }: LivestreamIndexProps) {
    const [rows, setRows] = useState<LivestreamRecord[]>(streams);
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: 'created_at',
            desc: true,
        },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [createdStreamData, setCreatedStreamData] = useState<{ ws_url: string; stream_key: string } | null>(null);
    const [productComboboxOpen, setProductComboboxOpen] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [searchedProducts, setSearchedProducts] = useState<ProductOption[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<{ title: string; product_ids: number[] }>({
        title: '',
        product_ids: [],
    });
    const page = usePage<{ flash: { createdStream?: { ws_url: string; stream_key: string } } }>();

    useEffect(() => {
        setRows(streams);
    }, [streams]);

    // Fetch products from server with debouncing
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const response = await axios.get('/products-search', {
                    params: {
                        q: productSearchQuery,
                        limit: 10,
                    },
                });
                setSearchedProducts(response.data);
            } catch (error) {
                console.error('Failed to fetch products:', error);
                setSearchedProducts([]);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        // Debounce the search
        const timeoutId = setTimeout(() => {
            if (productComboboxOpen) {
                fetchProducts();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [productSearchQuery, productComboboxOpen]);

    // Check for flash data with created stream credentials
    useEffect(() => {
        if (page.props.flash?.createdStream) {
            setCreatedStreamData(page.props.flash.createdStream);
            setIsSuccessDialogOpen(true);
        }
    }, [page.props.flash?.createdStream]);

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

    const titleFilterValue = (table.getColumn('title')?.getFilterValue() as string) ?? '';

    const handleCreateStream = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(
            livestreamStoreRoute().url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                },
            },
        );
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        reset();
        setProductSearchQuery('');
    };

    const closeSuccessDialog = () => {
        setIsSuccessDialogOpen(false);
        setCreatedStreamData(null);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    // Memoized selected products for badge display
    const selectedProducts = useMemo(() => {
        return data.product_ids
            .map(id => searchedProducts.find(p => p.id === id))
            .filter((p): p is ProductOption => p !== undefined);
    }, [data.product_ids, searchedProducts]);

    // Optimized toggle handler
    const toggleProduct = useCallback((productId: number) => {
        const isSelected = data.product_ids.includes(productId);
        setData('product_ids', isSelected
            ? data.product_ids.filter(id => id !== productId)
            : [...data.product_ids, productId]
        );
    }, [data.product_ids, setData]);

    // Optimized remove handler
    const removeProduct = useCallback((productId: number) => {
        setData('product_ids', data.product_ids.filter(id => id !== productId));
    }, [data.product_ids, setData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Livestreams" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Livestreams</h1>
                        <p className="text-muted-foreground">
                            Manage access credentials for your LiveKit rooms.
                        </p>
                    </div>
                    <Button className="w-full sm:w-auto" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="size-4" />
                        Create Livestream
                    </Button>
                </header>

                <Card className="border border-sidebar-border/70 shadow-none">
                    <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div />

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                                className="w-full min-w-[220px]"
                                placeholder="Search by title…"
                                value={titleFilterValue}
                                onChange={(event) =>
                                    table.getColumn('title')?.setFilterValue(event.target.value)
                                }
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="px-0 sm:px-0">
                        <div className="overflow-hidden rounded-lg border border-border/60">
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
                                            <TableRow key={row.id}>
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
                                                No livestreams found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 border-t border-sidebar-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredCount} of {totalCount} livestream
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
            <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create livestream</DialogTitle>
                        <DialogDescription>
                            Give this livestream a descriptive name so the team knows what it is for.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleCreateStream}>
                        <div className="space-y-2">
                            <Label htmlFor="new-stream-title">Title</Label>
                            <Input
                                id="new-stream-title"
                                placeholder="Spring product launch"
                                value={data.title}
                                onChange={(event) => setData('title', event.target.value)}
                                disabled={processing}
                                autoFocus
                                required
                            />
                            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Products (Optional)</Label>
                            <p className="text-sm text-muted-foreground">Select products to feature in this livestream</p>

                            {/* Combobox for selecting products */}
                            <Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={productComboboxOpen}
                                        className="w-full justify-between"
                                        disabled={processing}
                                    >
                                        <span className="truncate">
                                            {data.product_ids.length > 0
                                                ? `${data.product_ids.length} product(s) selected`
                                                : 'Search and select products...'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search products..."
                                            className="h-9"
                                            value={productSearchQuery}
                                            onValueChange={setProductSearchQuery}
                                        />
                                        <CommandList>
                                            {isLoadingProducts ? (
                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                    Loading products...
                                                </div>
                                            ) : searchedProducts.length === 0 ? (
                                                <CommandEmpty>
                                                    {productSearchQuery ? 'No products found.' : 'Start typing to search products...'}
                                                </CommandEmpty>
                                            ) : (
                                                <CommandGroup>
                                                    {searchedProducts.map((product) => {
                                                        const isSelected = data.product_ids.includes(product.id);
                                                        return (
                                                            <CommandItem
                                                                key={product.id}
                                                                value={product.id.toString()}
                                                                onSelect={() => toggleProduct(product.id)}
                                                            >
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    {product.image ? (
                                                                        <img
                                                                            src={product.image}
                                                                            alt={product.name}
                                                                            className="h-8 w-8 rounded object-cover flex-shrink-0"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                                                            <span className="text-xs text-muted-foreground">No img</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-sm truncate">{product.name}</p>
                                                                        <p className="text-xs text-muted-foreground">${parseFloat(product.price).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                                <Check
                                                                    className={cn(
                                                                        "ml-2 h-4 w-4 flex-shrink-0",
                                                                        isSelected ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* Display selected products as badges */}
                            {selectedProducts.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                                    {selectedProducts.map((product) => (
                                        <Badge
                                            key={product.id}
                                            variant="secondary"
                                            className="pl-2 pr-1 py-1 gap-1"
                                        >
                                            <span className="truncate max-w-[150px]">{product.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeProduct(product.id)}
                                                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:space-x-2">
                            <Button type="button" variant="ghost" onClick={closeDialog} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating…' : 'Create stream'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={(open) => (open ? setIsSuccessDialogOpen(true) : closeSuccessDialog())}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <DialogTitle>Livestream Created Successfully!</DialogTitle>
                                <DialogDescription>
                                    Your livestream is ready. Use these credentials to start streaming.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {createdStreamData && (
                        <div className="space-y-4">
                            {/* WebSocket URL */}
                            <div className="space-y-2">
                                <Label htmlFor="success-ws-url">WebSocket URL (Server)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="success-ws-url"
                                        value={createdStreamData.ws_url}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(createdStreamData.ws_url, 'WebSocket URL')}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Stream Key */}
                            <div className="space-y-2">
                                <Label htmlFor="success-stream-key">Stream Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="success-stream-key"
                                        value={createdStreamData.stream_key}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(createdStreamData.stream_key, 'Stream key')}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="rounded-lg bg-muted p-4">
                                <h4 className="mb-2 font-semibold text-sm">Setup Instructions for OBS:</h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                    <li>Open OBS Studio</li>
                                    <li>Go to Settings → Stream</li>
                                    <li>Select "Custom" as the service</li>
                                    <li>Paste the WebSocket URL in the "Server" field</li>
                                    <li>Paste the Stream Key in the "Stream Key" field</li>
                                    <li>Click "OK" and start streaming!</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={closeSuccessDialog} className="w-full sm:w-auto">
                            Got it, thanks!
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function maskStreamKey(key?: string | null) {
    if (!key) {
        return '—';
    }

    if (key.length <= 8) {
        return key;
    }

    return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

function formatDateTime(value?: string | null) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

