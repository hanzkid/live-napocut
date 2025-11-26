<?php

namespace App\Http\Controllers;

use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\VideoGrant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FrontController extends Controller
{
    //
    public function livestream()
    {
        $livekit = config('livekit');
        $token = session('livekit_token');

        $activeStream = \App\Models\LiveStream::where('is_active', true)
            ->with(['products.images'])
            ->latest()
            ->first();

        $hlsUrl = null;
        if ($activeStream && $activeStream->s3_path) {
            $hlsUrl = config('livekit.s3_public_url') . '/' . $activeStream->s3_path;
        }

        // Generate guest token if user doesn't have one and stream is active
        if (!$token && $activeStream) {
            $roomName = $activeStream->title;
            $guestName = 'Guest_' . rand(1000, 9999);

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

        // Format products for frontend
        $products = [];
        if ($activeStream) {
            $products = $activeStream->products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'formatted_price' => $product->formatted_price,
                    'plain_price' => $product->plain_price,
                    'description' => $product->description,
                    'link' => $product->link,
                    'image' => $product->images->first()?->url,
                    'images' => $product->images->map(fn($img) => $img->url)->toArray(),
                ];
            })->toArray();
        }

        return Inertia::render('live', [
            'livekit_ws_url' => $livekit['ws_url'],
            'livekit_token' => $token,
            'room_name' => $activeStream?->title,
            'hls_url' => $hlsUrl,
            'is_active' => $activeStream?->is_active ?? false,
            'is_guest' => session('is_guest', false),
            'products' => $products,
        ]);
    }

    public function joinLivestream(Request $request)
    {
        $livekit = config('livekit');
        $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $activeStream = \App\Models\LiveStream::where('is_active', true)
            ->latest()
            ->first();

        if (!$activeStream) {
            return redirect()->route('live')->withErrors([
                'stream' => 'No active livestream available at the moment.',
            ]);
        }

        $roomName = $activeStream->title;
        $participantName = $request->input('name') ?: optional($request->user())->name ?: 'Guest';

        $tokenOptions = (new AccessTokenOptions)
            ->setIdentity($participantName);

        $videoGrant = (new VideoGrant)
            ->setRoomJoin()
            ->setRoomName($roomName);

        $token = (new AccessToken($livekit['api_key'], $livekit['api_secret']))
            ->init($tokenOptions)
            ->setGrant($videoGrant)
            ->toJwt();

        session(['livekit_token' => $token, 'is_guest' => false]);

        return \Inertia\Inertia::location(route('live'));
    }
}
