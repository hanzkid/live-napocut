import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { show as livestreamShowRoute, index as livestreamIndexRoute } from '@/routes/livestream';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Copy } from 'lucide-react';
import { useMemo } from 'react';

type LivestreamData = {
    id: number;
    title: string;
    ws_url: string;
    stream_key: string;
    ingress_id: string;
    s3_path: string;
    is_active: boolean;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
    updated_at: string;
};

interface LivestreamShowProps {
    livestream: LivestreamData;
}

export default function LivestreamShow({ livestream }: LivestreamShowProps) {
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

                            {/* Started At */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Started At</label>
                                <div className="text-sm text-muted-foreground">
                                    {livestream.started_at ? formatDateTime(livestream.started_at) : '—'}
                                </div>
                            </div>

                            {/* Ended At */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ended At</label>
                                <div className="text-sm text-muted-foreground">
                                    {livestream.ended_at ? formatDateTime(livestream.ended_at) : '—'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
