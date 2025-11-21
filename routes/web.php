<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\FrontController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LivestreamController;
use App\Http\Controllers\LivekitWebhookController;

Route::post('/webhooks/livekit', [LivekitWebhookController::class, 'handle'])->name('webhooks.livekit');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::resource('livestream', LivestreamController::class)->names('livestream');
});

require __DIR__ . '/settings.php';

Route::get('/', [FrontController::class, 'livestream'])->name('live');

Route::post('live', [FrontController::class, 'joinLivestream'])->name('join-livestream');
