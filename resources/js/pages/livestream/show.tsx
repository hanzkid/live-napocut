import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { show as livestreamShowRoute, index as livestreamIndexRoute } from '@/routes/livestream';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Copy, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/livestream/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import axios from 'axios';

type ProductOption = {
    id: number;
    name: string;
    description: string | null;
    price: string;
    link: string | null;
    image: string | null;
};

type LivestreamData = {
    id: number;
    title: string;
    ws_url: string;
    stream_key: string;
    ingress_id: string;
    s3_path: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    products: ProductOption[];
};

interface LivestreamShowProps {
    livestream: LivestreamData;
}

export default function LivestreamShow({ livestream }: LivestreamShowProps) {
    const [products, setProducts] = useState<ProductOption[]>(livestream.products);
    const [productComboboxOpen, setProductComboboxOpen] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [searchedProducts, setSearchedProducts] = useState<ProductOption[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Livestreams',
            href: livestreamIndexRoute().url,
        },
        {
            title: livestream.title || `Stream #${livestream.id}`,
            href: livestreamShowRoute({ livestream: livestream.id }).url,
        },
    ];

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    const maskStreamKey = (key: string) => {
        if (key.length <= 8) return key;
        return `${key.slice(0, 4)}••••${key.slice(-4)}`;
    };

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

        const timeoutId = setTimeout(() => {
            if (productComboboxOpen) {
                fetchProducts();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [productSearchQuery, productComboboxOpen]);

    const handleAddProduct = async (productId: number) => {
        if (products.some(p => p.id === productId)) {
            toast.error('Product already added to this livestream');
            return;
        }

        setIsAddingProduct(true);
        try {
            await axios.post(`/livestream/${livestream.id}/products`, {
                product_id: productId,
            });

            const addedProduct = searchedProducts.find(p => p.id === productId);
            if (addedProduct) {
                setProducts([...products, addedProduct]);
                toast.success('Product added successfully');
                setProductComboboxOpen(false);
                setProductSearchQuery('');
            }
        } catch (error) {
            console.error('Failed to add product:', error);
            toast.error('Failed to add product');
        } finally {
            setIsAddingProduct(false);
        }
    };

    const handleRemoveProduct = async (productId: number) => {
        try {
            await axios.delete(`/livestream/${livestream.id}/products/${productId}`);
            setProducts(products.filter(p => p.id !== productId));
            toast.success('Product removed successfully');
        } catch (error) {
            console.error('Failed to remove product:', error);
            toast.error('Failed to remove product');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={livestream.title || 'Livestream Details'} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{livestream.title}</h1>
                        <p className="text-muted-foreground">
                            Manage your livestream details and attached products.
                        </p>
                    </div>
                    <Badge variant={livestream.is_active ? 'default' : 'secondary'} className="w-fit">
                        {livestream.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </header>

                {/* Livestream Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Livestream Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* WebSocket URL */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">WebSocket URL (Server)</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 rounded-md border bg-muted px-3 py-2">
                                        <code className="text-xs break-all">{livestream.ws_url}</code>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(livestream.ws_url, 'WebSocket URL')}
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Stream Key */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Stream Key</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 rounded-md border bg-muted px-3 py-2">
                                        <code className="text-xs">{maskStreamKey(livestream.stream_key)}</code>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(livestream.stream_key, 'Stream key')}
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Ingress ID */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ingress ID</label>
                                <div className="rounded-md border bg-muted px-3 py-2">
                                    <code className="text-xs break-all">{livestream.ingress_id}</code>
                                </div>
                            </div>

                            {/* S3 Path */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">S3 Path</label>
                                <div className="rounded-md border bg-muted px-3 py-2">
                                    <code className="text-xs break-all">{livestream.s3_path}</code>
                                </div>
                            </div>

                            {/* Created At */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Created</label>
                                <div className="text-sm text-muted-foreground">
                                    {formatDateTime(livestream.created_at)}
                                </div>
                            </div>

                            {/* Updated At */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Last Updated</label>
                                <div className="text-sm text-muted-foreground">
                                    {formatDateTime(livestream.updated_at)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs Section */}
                <Tabs defaultValue="products" className="w-full">
                    <TabsList>
                        <TabsTrigger value="products">Products ({livestream.products.length})</TabsTrigger>
                        <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">
                                {products.length} product{products.length !== 1 ? 's' : ''} attached
                            </p>

                            {/* Add Product Combobox */}
                            <Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Product
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="end">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search products..."
                                            value={productSearchQuery}
                                            onValueChange={setProductSearchQuery}
                                        />
                                        <CommandList>
                                            {isLoadingProducts ? (
                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                    Loading...
                                                </div>
                                            ) : searchedProducts.length === 0 ? (
                                                <CommandEmpty>
                                                    {productSearchQuery ? 'No products found.' : 'Start typing to search...'}
                                                </CommandEmpty>
                                            ) : (
                                                <CommandGroup>
                                                    {searchedProducts.map((product) => (
                                                        <CommandItem
                                                            key={product.id}
                                                            value={product.id.toString()}
                                                            onSelect={() => handleAddProduct(product.id)}
                                                            disabled={isAddingProduct}
                                                        >
                                                            <div className="flex items-center gap-2 flex-1">
                                                                {product.image ? (
                                                                    <img
                                                                        src={product.image}
                                                                        alt={product.name}
                                                                        className="h-8 w-8 rounded object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                                        <span className="text-xs">No img</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-sm truncate">{product.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{product.price}</p>
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {products.length > 0 ? (
                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Image</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="w-[100px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="h-12 w-12 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                                            <span className="text-xs text-muted-foreground">No image</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{product.name}</p>
                                                        {product.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                                {product.description.replace(/<[^>]*>/g, '')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold">{product.price}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {product.link && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                asChild
                                                            >
                                                                <a
                                                                    href={product.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="View product"
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveProduct(product.id)}
                                                            title="Remove product"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <p className="text-muted-foreground mb-4">No products attached to this livestream</p>
                                    <p className="text-sm text-muted-foreground">
                                        Click "Add Product" to attach products
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="analytics">
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <p className="text-muted-foreground">Analytics coming soon</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
