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

    public function monitoring()
    {
        $livekit = config('livekit');
        $user = auth()->user();

        $activeStream = LiveStream::where('is_active', true)
            ->latest()
            ->first();

        $rawProducts = Product::where('is_show', true)
            ->with(['images', 'category'])
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $hlsUrl = null;
        if ($activeStream && $activeStream->s3_path) {
            $hlsUrl = config('livekit.s3_public_url').'/'.$activeStream->s3_path;
        }

        // Generate admin token if stream is active
        $token = null;
        if ($activeStream && $user) {
            $roomName = $activeStream->clean_title;
            $adminName = $user->name ?? 'Admin';

            $tokenOptions = (new \Agence104\LiveKit\AccessTokenOptions)
                ->setIdentity($adminName);

            $videoGrant = (new \Agence104\LiveKit\VideoGrant)
                ->setRoomJoin()
                ->setRoomName($roomName);

            $token = (new \Agence104\LiveKit\AccessToken($livekit['api_key'], $livekit['api_secret']))
                ->init($tokenOptions)
                ->setGrant($videoGrant)
                ->toJwt();
        }

        $products = [];
        if ($activeStream) {
            $products = $rawProducts->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'formatted_price' => $product->formatted_price,
                    'plain_price' => $product->plain_price,
                    'description' => $product->description,
                    'link' => $product->link,
                    'category' => $product->category?->name,
                    'image' => $product->images->first()?->url,
                    'images' => $product->images->map(fn ($img) => $img->url)->toArray(),
                ];
            })->toArray();
        }

        $discountCodes = DiscountCode::where(function ($query) {
            $query->whereNull('valid_start_date')
                ->orWhere('valid_start_date', '<=', now());
        })
            ->where(function ($query) {
                $query->whereNull('valid_end_date')
                    ->orWhere('valid_end_date', '>=', now());
            })
            ->get()
            ->map(function ($code) {
                return [
                    'code' => $code->discount_code,
                    'description' => $code->description,
                ];
            })
            ->toArray();

        return Inertia::render('monitoring', [
            'livekit_ws_url' => $livekit['ws_url'],
            'livekit_token' => $token,
            'room_name' => $activeStream?->title,
            'clean_room_name' => $activeStream?->clean_title,
            'hls_url' => $hlsUrl,
            'is_active' => $activeStream?->is_active ?? false,
            'products' => $products,
            'discountCodes' => $discountCodes,
            'livestream_id' => $activeStream?->id,
            'user_name' => $user?->name ?? 'Admin',
        ]);
    }
}
