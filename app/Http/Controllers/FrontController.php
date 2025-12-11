<?php

namespace App\Http\Controllers;

use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\VideoGrant;
use App\Models\DiscountCode;
use App\Models\LiveStream;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FrontController extends Controller
{
    //
    public function livestream(Request $request)
    {
        $livekit = config('livekit');
        $token = session('livekit_token');

        $activeStream = LiveStream::where('is_active', true)
            ->latest()
            ->first();

        $rawProducts = Product::where('is_show', true)
            ->with(['images', 'category'])
            ->get();

        $hlsUrl = null;
        if ($activeStream && $activeStream->s3_path) {
            $hlsUrl = config('livekit.s3_public_url') . '/' . $activeStream->s3_path;
        }

        if (!$token && $activeStream) {
            $roomName = $activeStream->title;

            $name = $request->input('name');
            if ($name) {
                $guestName = $name;
            } else {
                $guestName = 'Guest_' . rand(1000, 9999);
            }

            $tokenOptions = (new \Agence104\LiveKit\AccessTokenOptions)
                ->setIdentity($guestName);

            $videoGrant = (new \Agence104\LiveKit\VideoGrant)
                ->setRoomJoin()
                ->setRoomName($roomName);

            $token = (new \Agence104\LiveKit\AccessToken($livekit['api_key'], $livekit['api_secret']))
                ->init($tokenOptions)
                ->setGrant($videoGrant)
                ->toJwt();

            session(['livekit_token' => $token, 'is_guest' => true]);
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
                    'images' => $product->images->map(fn($img) => $img->url)->toArray(),
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

        $isGuest = session('is_guest', false);

        return Inertia::render('live', [
            'livekit_ws_url' => $livekit['ws_url'],
            'livekit_token' => $token,
            'room_name' => $activeStream?->title,
            'hls_url' => $hlsUrl,
            'is_active' => $activeStream?->is_active ?? false,
            'is_guest' => $isGuest,
            'products' => $products,
            'discountCodes' => $discountCodes,
            'livestream_id' => $activeStream?->id,
            'user_name' => $isGuest ? (session('viewer_name') ?? 'Guest') : (auth()->user()?->name ?? 'Viewer'),
        ]);
    }

    public function joinLivestream(Request $request)
    {
        $livekit = config('livekit');
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $activeStream = LiveStream::where('is_active', true)
            ->latest()
            ->first();

        if (!$activeStream) {
            return back()->withErrors([
                'name' => 'No active livestream available at the moment.',
            ]);
        }

        $roomName = $activeStream->title;
        $newName = $request->input('name');

        $tokenOptions = (new AccessTokenOptions)
            ->setIdentity($newName);

        $videoGrant = (new VideoGrant)
            ->setRoomJoin()
            ->setRoomName($roomName);

        $token = (new AccessToken($livekit['api_key'], $livekit['api_secret']))
            ->init($tokenOptions)
            ->setGrant($videoGrant)
            ->toJwt();

        session(['livekit_token' => $token, 'is_guest' => false]);

        return back();
    }
}
