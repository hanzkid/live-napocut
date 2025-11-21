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
import { ArrowUpDown, Copy, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

type LivestreamRecord = {
    id: number;
    title: string | null;
    ws_url: string | null;
    stream_key: string | null;
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
    const { data, setData, post, processing, errors, reset } = useForm<{ title: string }>({
        title: '',
    });

    useEffect(() => {
        setRows(streams);
    }, [streams]);

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

