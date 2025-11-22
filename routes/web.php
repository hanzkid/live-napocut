<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\FrontController;
use App\Http\Controllers\LivekitWebhookController;
use App\Http\Controllers\LivestreamController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

Route::post('/webhooks/livekit', [LivekitWebhookController::class, 'handle'])->name('webhooks.livekit');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::resource('livestream', LivestreamController::class)->names('livestream');
    Route::resource('products', ProductController::class)->except(['show', 'create', 'edit']);
    Route::get('products-search', [ProductController::class, 'search'])->name('products.search');
    Route::post('products/import-from-url', [ProductController::class, 'importFromUrl'])->name('products.import-from-url');
    Route::delete('product-images/{image}', [ProductController::class, 'deleteImage'])->name('product-images.destroy');
});

require __DIR__ . '/settings.php';

Route::get('/', [FrontController::class, 'livestream'])->name('live');

Route::post('live', [FrontController::class, 'joinLivestream'])->name('join-livestream');
