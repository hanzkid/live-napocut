<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function () {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <link rel="icon" href="/favicon-napocut.ico" sizes="any">
    <link rel="icon" href="/logo-napocut.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    <meta name="description"
        content="JOIN Live Now! Dapatkan produk gratis selama Live, mulai dari voucher diskon 50rb hingga gratis ongkir." />

    <!-- Google / Search Engine Tags -->
    <meta itemprop="name" content="Napocut - Live Shopping" />
    <meta itemprop="description"
        content="JOIN Live Now! Dapatkan produk gratis selama Live, mulai dari voucher diskon 50rb hingga gratis ongkir." />
    <meta itemprop="image" content="https://live.napocut.com/og.jpeg" />

    <!-- Facebook Meta Tags -->
    <meta property="og:url" content="https://live.napocut.com/" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Napocut - Live Shopping" />
    <meta property="og:description"
        content="JOIN Live Now! Dapatkan produk gratis selama Live, mulai dari voucher diskon 50rb hingga gratis ongkir." />
    <meta property="og:image" content="https://live.napocut.com/og.jpeg" />

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Napocut - Live Shopping" />
    <meta name="twitter:description"
        content="JOIN Live Now! Dapatkan produk gratis selama Live, mulai dari voucher diskon 50rb hingga gratis ongkir." />
    <meta name="twitter:image" content="https://live.napocut.com/og.jpeg" />

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>