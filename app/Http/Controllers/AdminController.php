<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\DiscountCode;
use App\Models\LiveStream;
use App\Models\Product;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function dashboard()
    {
        $stats = [
            'total_livestreams' => LiveStream::count(),
            'active_livestreams' => LiveStream::where('is_active', true)->count(),
            'total_products' => Product::count(),
            'visible_products' => Product::where('is_show', true)->count(),
            'total_categories' => Category::count(),
        ];

        $recentLivestreams = LiveStream::latest()
            // TODO: Re-enable after client approval
            // ->with('products')
            ->take(5)
            ->get()
            ->map(function ($livestream) {
                return [
                    'id' => $livestream->id,
                    'title' => $livestream->title,
                    'is_active' => $livestream->is_active,
                    // TODO: Re-enable after client approval
                    // 'products_count' => $livestream->products->count(),
                    'started_at' => $livestream->started_at,
                    'ended_at' => $livestream->ended_at,
                    'created_at' => $livestream->created_at,
                ];
            });

        // Get active discount codes
        $activeDiscountCodes = DiscountCode::latest()
            ->get()
            ->filter(function ($code) {
                return $code->isValid();
            })
            ->take(5)
            ->map(function ($code) {
                return [
                    'id' => $code->id,
                    'discount_code' => $code->discount_code,
                    'description' => $code->description,
                    'valid_start_date' => $code->valid_start_date?->toAtomString(),
                    'valid_end_date' => $code->valid_end_date?->toAtomString(),
                ];
            })
            ->values();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentLivestreams' => $recentLivestreams,
            'activeDiscountCodes' => $activeDiscountCodes,
        ]);
    }
}
