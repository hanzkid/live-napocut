<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImportService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('products:import {--limit=50 : Number of products to fetch} {--offset=0 : Offset for pagination}', function () {
    $limit = (int) $this->option('limit');
    $offset = (int) $this->option('offset');
    
    $baseUrl = 'https://api.plugo.world/v1/shop/5812/products?search&available=false&sort=sold_out,-sort,-id';
    $apiUrl = $baseUrl.'&limit='.$limit.'&offset='.$offset;
    
    $this->info('Fetching product list from Plugo API...');
    $this->info('Limit: '.$limit.', Offset: '.$offset);
    $this->info('API URL: '.$apiUrl);

    $response = Http::get($apiUrl);

    if (! $response->successful()) {
        $this->error('Failed to fetch products list. HTTP status: '.$response->status());
        return;
    }

    $datas = $response->json('data') ?? $response['data'] ?? [];

    if (empty($datas)) {
        $this->warn('No products returned from API.');
        return;
    }

    /** @var \App\Services\ProductImportService $importService */
    $importService = app(ProductImportService::class);

    foreach ($datas as $data) {
        if (! isset($data['id'])) {
            $this->warn('Skipping item without id.');
            continue;
        }

        $url = 'https://napocut.com/products/'.$data['id'];

        try {
            $productData = $importService->importFromUrl($url);

            // Save product inside transaction (same logic as ProductController::importFromUrl)
            DB::transaction(function () use ($productData) {
                // Find or create category if category data exists
                $categoryId = null;
                if (isset($productData['category']) && ! empty($productData['category']['name'])) {
                    $category = Category::firstOrCreate(
                        ['name' => $productData['category']['name']]
                    );
                    $categoryId = $category->id;
                }

                $product = Product::create([
                    'name' => $productData['name'],
                    'description' => $productData['description'],
                    'price' => $productData['price'],
                    'link' => $productData['link'],
                    'category_id' => $categoryId,
                ]);

                foreach ($productData['images'] as $index => $imageUrl) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => null,
                        'url' => $imageUrl,
                        'order' => $index,
                    ]);
                }
            });

            $this->info('Imported and saved product: '.$productData['name'].' ('.$url.')');
        } catch (\Throwable $e) {
            $this->error('Failed to import product '.$data['id'].' - '.$e->getMessage());

            $logPath = storage_path('logs/failed.csv');
            $line = sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\"%s",
                now()->toDateTimeString(),
                $data['id'],
                $url,
                str_replace(["\r", "\n"], ' ', $e->getMessage()),
                PHP_EOL
            );
            @file_put_contents($logPath, $line, FILE_APPEND);
        }

        sleep(3);
    }
})->purpose('Import products from Plugo API and scrape details from napocut.com');

Artisan::command('products:import-from-failed-csv {path? : Path to failed CSV file (default: storage/logs/failed.csv)}', function () {
    $path = $this->argument('path') ?: storage_path('logs/failed.csv');

    if (! file_exists($path)) {
        $this->error('Failed CSV file not found at: '.$path);
        return;
    }

    $this->info('Importing products from failed CSV: '.$path);

    /** @var \App\Services\ProductImportService $importService */
    $importService = app(ProductImportService::class);

    if (($handle = fopen($path, 'r')) === false) {
        $this->error('Unable to open failed CSV file.');
        return;
    }

    $row = 0;
    while (($data = fgetcsv($handle)) !== false) {
        $row++;

        // Expecting: [timestamp, product_id, url, error_message]
        if (count($data) < 3) {
            $this->warn("Skipping row {$row}: invalid format");
            continue;
        }

        $timestamp = $data[0] ?? null;
        $productId = $data[1] ?? null;
        $url = $data[2] ?? null;

        if (! $url) {
            $this->warn("Skipping row {$row}: missing URL");
            continue;
        }

        $this->info("Re-importing product {$productId} from URL: {$url}");

        try {
            $productData = $importService->importFromUrl($url);

            DB::transaction(function () use ($productData) {
                // Find or create category if category data exists
                $categoryId = null;
                if (isset($productData['category']) && ! empty($productData['category']['name'])) {
                    $category = Category::firstOrCreate(
                        ['name' => $productData['category']['name']]
                    );
                    $categoryId = $category->id;
                }

                $product = Product::create([
                    'name' => $productData['name'],
                    'description' => $productData['description'],
                    'price' => $productData['price'],
                    'link' => $productData['link'],
                    'category_id' => $categoryId,
                ]);

                foreach ($productData['images'] as $index => $imageUrl) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => null,
                        'url' => $imageUrl,
                        'order' => $index,
                    ]);
                }
            });

            $this->info('Imported and saved product: '.$productData['name'].' ('.$url.')');
        } catch (\Throwable $e) {
            $this->error("Failed to import product {$productId} from row {$row} - ".$e->getMessage());
        }

        // Be gentle with the remote server
        sleep(3);
    }

    fclose($handle);
})->purpose('Import products again based on entries from failed.csv');

