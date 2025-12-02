<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DiscountCodeController;
use App\Http\Controllers\FrontController;
use App\Http\Controllers\LivekitWebhookController;
use App\Http\Controllers\LivestreamController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

Route::post('/webhooks/livekit', [LivekitWebhookController::class, 'handle'])->name('webhooks.livekit');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::resource('livestream', LivestreamController::class)->names('livestream');
    Route::resource('categories', CategoryController::class)->except(['create', 'edit']);
    Route::resource('discount-codes', DiscountCodeController::class)->except(['create', 'edit']);
    Route::resource('products', ProductController::class);
    Route::get('products-search', [ProductController::class, 'search'])->name('products.search');
    Route::post('products/import-from-url', [ProductController::class, 'importFromUrl'])->name('products.import-from-url');
    Route::post('products/{product}/images', [ProductController::class, 'uploadImages'])->name('products.images.upload');
    Route::delete('product-images/{image}', [ProductController::class, 'deleteImage'])->name('product-images.destroy');
    Route::post('livestream/{livestream}/products', [LivestreamController::class, 'attachProduct'])->name('livestream.products.attach');
    Route::delete('livestream/{livestream}/products/{product}', [LivestreamController::class, 'detachProduct'])->name('livestream.products.detach');
    Route::patch('products/{product}/toggle-visibility', [ProductController::class, 'toggleVisibility'])->name('products.toggle-visibility');
});

require __DIR__ . '/settings.php';

Route::get('/', [FrontController::class, 'livestream'])->name('live');

Route::post('live', [FrontController::class, 'joinLivestream'])->name('join-livestream');
