import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/livestream/ui/table';
import AppLayout from '@/layouts/app-layout';
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
import { ArrowUpDown, Plus, Pencil, Trash2, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

type DiscountCodeRecord = {
    id: number;
    discount_code: string;
    description: string | null;
    valid_start_date: string | null;
    valid_end_date: string | null;
    is_valid: boolean;
    created_at: string;
};

interface DiscountCodesIndexProps {
    discountCodes: DiscountCodeRecord[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Discount Codes',
        href: '/discount-codes',
    },
];

export default function DiscountCodesIndex({ discountCodes = [] }: DiscountCodesIndexProps) {
    const [rows, setRows] = useState<DiscountCodeRecord[]>(discountCodes);
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: 'created_at',
            desc: true,
        },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [codeToDelete, setCodeToDelete] = useState<number | null>(null);
    const [editingCode, setEditingCode] = useState<DiscountCodeRecord | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<{
        discount_code: string;
        description: string;
        valid_start_date: string;
        valid_end_date: string;
    }>({
        discount_code: '',
        description: '',
        valid_start_date: '',
        valid_end_date: '',
    });

    useEffect(() => {
        setRows(discountCodes);
    }, [discountCodes]);

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const columns: ColumnDef<DiscountCodeRecord>[] = [
        {
            accessorKey: 'discount_code',
            header: () => <span className="text-sm font-semibold">Code</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-semibold text-foreground">{row.original.discount_code}</span>
                </div>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'description',
            header: () => <span className="text-sm font-semibold">Description</span>,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.description || 'No description'}
                </span>
            ),
        },
        {
            accessorKey: 'valid_start_date',
            header: () => <span className="text-sm font-semibold">Start Date</span>,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {formatDateTime(row.original.valid_start_date)}
                </span>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'valid_end_date',
            header: () => <span className="text-sm font-semibold">End Date</span>,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {formatDateTime(row.original.valid_end_date)}
                </span>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'is_valid',
            header: () => <span className="text-sm font-semibold">Status</span>,
            cell: ({ row }) => (
                <Badge variant={row.original.is_valid ? 'default' : 'secondary'} className="gap-1">
                    {row.original.is_valid ? (
                        <>
                            <CheckCircle2 className="h-3 w-3" />
                            Valid
                        </>
                    ) : (
                        <>
                            <XCircle className="h-3 w-3" />
                            Invalid
                        </>
                    )}
                </Badge>
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
                        title="Edit discount code"
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
                        title="Delete discount code"
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
    const codeFilterValue = (table.getColumn('discount_code')?.getFilterValue() as string) ?? '';

    const handleCreate = () => {
        setEditingCode(null);
        reset();
        setIsDialogOpen(true);
    };

    const handleEdit = (code: DiscountCodeRecord) => {
        setEditingCode(code);
        setData({
            discount_code: code.discount_code,
            description: code.description || '',
            valid_start_date: code.valid_start_date ? new Date(code.valid_start_date).toISOString().slice(0, 16) : '',
            valid_end_date: code.valid_end_date ? new Date(code.valid_end_date).toISOString().slice(0, 16) : '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setCodeToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!codeToDelete) return;

        router.delete(`/discount-codes/${codeToDelete}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Discount code deleted successfully');
                setIsDeleteDialogOpen(false);
                setCodeToDelete(null);
            },
            onError: () => {
                toast.error('Failed to delete discount code');
            },
        });
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const submitData = {
            discount_code: data.discount_code,
            description: data.description || null,
            valid_start_date: data.valid_start_date || null,
            valid_end_date: data.valid_end_date || null,
        };

        if (editingCode) {
            router.put(`/discount-codes/${editingCode.id}`, submitData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                    toast.success('Discount code updated successfully');
                },
            });
        } else {
            router.post('/discount-codes', submitData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                    toast.success('Discount code created successfully');
                },
            });
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        reset();
        setEditingCode(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Discount Codes" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <header className="flex flex-col gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">Discount Codes</h1>
                    <p className="text-muted-foreground">
                        Manage discount codes for your livestream promotions.
                    </p>
                </header>

                <Card className="shadow-none border-0">
                    <CardContent className="p-0">
                        <div className="pb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <Input
                                className="w-full sm:w-[300px]"
                                placeholder="Search discount codes..."
                                value={codeFilterValue}
                                onChange={(event) =>
                                    table.getColumn('discount_code')?.setFilterValue(event.target.value)
                                }
                            />
                            <Button className="w-full sm:w-auto" onClick={handleCreate}>
                                <Plus className="size-4" />
                                Create Discount Code
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
                                                No discount codes found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 border-t border-sidebar-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredCount} of {totalCount} discount code{totalCount === 1 ? '' : 's'}
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingCode ? 'Edit Discount Code' : 'Create Discount Code'}</DialogTitle>
                        <DialogDescription>
                            {editingCode ? 'Update discount code information.' : 'Add a new discount code for promotions.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="discount-code">Discount Code</Label>
                            <Input
                                id="discount-code"
                                placeholder="LIVE20"
                                value={data.discount_code}
                                onChange={(e) => setData('discount_code', e.target.value.toUpperCase())}
                                disabled={processing}
                                required
                            />
                            {errors.discount_code && <p className="text-sm text-destructive">{errors.discount_code}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="20% off all items"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                disabled={processing}
                                rows={3}
                            />
                            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="valid-start-date">Start Date (Optional)</Label>
                                <Input
                                    id="valid-start-date"
                                    type="datetime-local"
                                    value={data.valid_start_date}
                                    onChange={(e) => setData('valid_start_date', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.valid_start_date && <p className="text-sm text-destructive">{errors.valid_start_date}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="valid-end-date">End Date (Optional)</Label>
                                <Input
                                    id="valid-end-date"
                                    type="datetime-local"
                                    value={data.valid_end_date}
                                    onChange={(e) => setData('valid_end_date', e.target.value)}
                                    disabled={processing}
                                />
                                {errors.valid_end_date && <p className="text-sm text-destructive">{errors.valid_end_date}</p>}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:space-x-2">
                            <Button type="button" variant="ghost" onClick={closeDialog} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : editingCode ? 'Update Discount Code' : 'Create Discount Code'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Discount Code</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this discount code? This action cannot be undone.
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

