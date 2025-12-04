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
import { index as livestreamIndexRoute, store as livestreamStoreRoute, show as livestreamShowRoute } from '@/routes/livestream';
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
import { ArrowUpDown, Copy, Plus, CheckCircle2, Check, ChevronsUpDown, X } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
// Product selection has been removed from livestreams

type LivestreamRecord = {
    id: number;
    title: string | null;
    ws_url: string | null;
    stream_key: string | null;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
    updated_at: string;
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
                        onClick={(e) => {
                            e.stopPropagation();
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
                        onClick={(e) => {
                            e.stopPropagation();
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
    {
        accessorKey: 'started_at',
        header: () => <span className="text-sm font-semibold">Stream Status</span>,
        cell: ({ row }) => {
            const { started_at, ended_at, is_active } = row.original;
            if (is_active && started_at) {
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
                        <span className="text-xs text-muted-foreground">Started: {formatDateTime(started_at)}</span>
                    </div>
                );
            }
            if (ended_at && started_at) {
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Ended</span>
                        <span className="text-xs text-muted-foreground">
                            {formatDateTime(started_at)} - {formatDateTime(ended_at)}
                        </span>
                    </div>
                );
            }
            return <span className="text-sm text-muted-foreground">—</span>;
        },
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
    const { data, setData, post, processing, errors, reset } = useForm<{ title: string }>({
        title: '',
    });
    const page = usePage<{ flash: { createdStream?: { ws_url: string; stream_key: string } } }>();

    useEffect(() => {
        setRows(streams);
    }, [streams]);

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
    };

    const closeSuccessDialog = () => {
        setIsSuccessDialogOpen(false);
        setCreatedStreamData(null);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

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
                </header>

                <Card className="shadow-none border-0">
                    <CardContent className="p-0">
                        <div className="pb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <Input
                                className="w-full sm:w-[300px]"
                                placeholder="Search streams..."
                                value={titleFilterValue}
                                onChange={(event) =>
                                    table.getColumn('title')?.setFilterValue(event.target.value)
                                }
                            />
                            <Button className="w-full sm:w-auto" onClick={() => setIsDialogOpen(true)}>
                                <Plus className="size-4" />
                                Create Stream
                            </Button>
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
                                                onClick={() => router.visit(livestreamShowRoute({ livestream: row.original.id }).url)}
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

