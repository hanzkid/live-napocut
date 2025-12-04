import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Video,
    Package,
    FolderTree,
    Activity,
    Eye,
    EyeOff,
    Calendar,
    Tag,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardStats {
    total_livestreams: number;
    active_livestreams: number;
    total_products: number;
    visible_products: number;
    total_categories: number;
}

interface RecentLivestream {
    id: number;
    title: string;
    is_active: boolean;
    // TODO: Re-enable after client approval
    // products_count: number;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
}

interface ActiveDiscountCode {
    id: number;
    discount_code: string;
    description: string | null;
    valid_start_date: string | null;
    valid_end_date: string | null;
}

interface DashboardProps {
    stats: DashboardStats;
    recentLivestreams: RecentLivestream[];
    activeDiscountCodes: ActiveDiscountCode[];
}

export default function Dashboard({ stats, recentLivestreams, activeDiscountCodes = [] }: DashboardProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Livestreams Card */}
                    <Link
                        href="/livestream"
                        className="group relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 transition-all hover:shadow-lg hover:border-blue-500/50 cursor-pointer dark:border-sidebar-border"
                    >
                        <div className="absolute right-0 top-0 -mr-8 -mt-8 size-32 rounded-full bg-blue-500/10 blur-2xl" />
                        <div className="relative">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="rounded-lg bg-blue-500/10 p-3">
                                    <Video className="size-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <Activity className="size-5 text-blue-600/50 dark:text-blue-400/50" />
                            </div>
                            <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                                Livestreams
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold">{stats.total_livestreams}</p>
                                <span className="text-sm text-muted-foreground">
                                    ({stats.active_livestreams} active)
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Products Card */}
                    <Link
                        href="/products"
                        className="group relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 transition-all hover:shadow-lg hover:border-green-500/50 cursor-pointer dark:border-sidebar-border"
                    >
                        <div className="absolute right-0 top-0 -mr-8 -mt-8 size-32 rounded-full bg-green-500/10 blur-2xl" />
                        <div className="relative">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="rounded-lg bg-green-500/10 p-3">
                                    <Package className="size-6 text-green-600 dark:text-green-400" />
                                </div>
                                <Eye className="size-5 text-green-600/50 dark:text-green-400/50" />
                            </div>
                            <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                                Products
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold">{stats.total_products}</p>
                                <span className="text-sm text-muted-foreground">
                                    ({stats.visible_products} visible)
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Categories Card */}
                    <Link
                        href="/categories"
                        className="group relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 transition-all hover:shadow-lg hover:border-purple-500/50 cursor-pointer dark:border-sidebar-border"
                    >
                        <div className="absolute right-0 top-0 -mr-8 -mt-8 size-32 rounded-full bg-purple-500/10 blur-2xl" />
                        <div className="relative">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="rounded-lg bg-purple-500/10 p-3">
                                    <FolderTree className="size-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                            <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                                Categories
                            </h3>
                            <p className="text-3xl font-bold">{stats.total_categories}</p>
                        </div>
                    </Link>
                </div>

                {/* Active Discount Codes */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
                    <div className="border-b border-sidebar-border/70 p-6 dark:border-sidebar-border">
                        <h2 className="text-lg font-semibold">Active Discount Codes</h2>
                        <p className="text-sm text-muted-foreground">
                            Currently active promotional codes
                        </p>
                    </div>
                    <div className="p-6">
                        {activeDiscountCodes.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8">
                                <Tag className="size-12 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">
                                    No active discount codes
                                </p>
                                <Link
                                    href="/discount-codes"
                                    className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Create discount code →
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {activeDiscountCodes.map((code) => (
                                    <div
                                        key={code.id}
                                        className="group rounded-lg border border-sidebar-border/70 bg-muted/30 p-4 transition-all hover:border-blue-500/50 hover:bg-muted/50 dark:border-sidebar-border"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="font-mono font-semibold text-lg">
                                                        {code.discount_code}
                                                    </span>
                                                </div>
                                                {code.description && (
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {code.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                    {code.valid_start_date && (
                                                        <span>
                                                            Starts: {formatDate(code.valid_start_date)}
                                                        </span>
                                                    )}
                                                    {code.valid_end_date && (
                                                        <span>
                                                            Ends: {formatDate(code.valid_end_date)}
                                                        </span>
                                                    )}
                                                    {!code.valid_start_date && !code.valid_end_date && (
                                                        <span>No expiration</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeDiscountCodes.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-sidebar-border/70 dark:border-sidebar-border">
                                <Link
                                    href="/discount-codes"
                                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    View all discount codes →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Livestreams */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
                    <div className="border-b border-sidebar-border/70 p-6 dark:border-sidebar-border">
                        <h2 className="text-lg font-semibold">Recent Livestreams</h2>
                        <p className="text-sm text-muted-foreground">
                            Your latest livestream activities
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-sidebar-border/70 text-sm dark:border-sidebar-border">
                                    <th className="p-4 text-left font-medium text-muted-foreground">
                                        Title
                                    </th>
                                    <th className="p-4 text-left font-medium text-muted-foreground">
                                        Status
                                    </th>
                                    {/* TODO: Re-enable after client approval */}
                                    {/* <th className="p-4 text-left font-medium text-muted-foreground">
                                        Products
                                    </th> */}
                                    <th className="p-4 text-left font-medium text-muted-foreground">
                                        Created
                                    </th>
                                    <th className="p-4 text-left font-medium text-muted-foreground">
                                        Duration
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLivestreams.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Video className="size-12 text-muted-foreground/30" />
                                                <p className="text-sm text-muted-foreground">
                                                    No livestreams yet
                                                </p>
                                                <Link
                                                    href="/livestream/create"
                                                    className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    Create your first livestream
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentLivestreams.map((stream) => (
                                        <tr
                                            key={stream.id}
                                            className="border-b border-sidebar-border/70 transition-colors hover:bg-muted/50 dark:border-sidebar-border"
                                        >
                                            <td className="p-4">
                                                <Link
                                                    href={`/livestream/${stream.id}`}
                                                    className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
                                                >
                                                    {stream.title}
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                {stream.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                                                        <span className="size-1.5 rounded-full bg-green-600 dark:bg-green-400" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        <EyeOff className="size-3" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            {/* TODO: Re-enable after client approval */}
                                            {/* <td className="p-4 text-sm text-muted-foreground">
                                                {stream.products_count} products
                                            </td> */}
                                            <td className="p-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="size-3.5" />
                                                    {formatDate(stream.created_at)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {stream.started_at && stream.ended_at ? (
                                                    <span>
                                                        {formatDate(stream.started_at)} -{' '}
                                                        {formatDate(stream.ended_at)}
                                                    </span>
                                                ) : stream.started_at ? (
                                                    <span>Started: {formatDate(stream.started_at)}</span>
                                                ) : (
                                                    <span>Not started</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {recentLivestreams.length > 0 && (
                        <div className="border-t border-sidebar-border/70 p-4 dark:border-sidebar-border">
                            <Link
                                href="/livestream"
                                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                            >
                                View all livestreams →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
