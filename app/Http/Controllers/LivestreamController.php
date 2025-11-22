<?php

namespace App\Http\Controllers;

use App\Models\LiveStream;
use App\Services\Livekit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LivestreamController extends Controller
{
    public function index(): Response
    {
        $streams = LiveStream::select([
            'id',
            'title',
            'ws_url',
            'stream_key',
            'is_active',
            'created_at',
        ])->with('products.images')->latest()->get();

        $allProducts = \App\Models\Product::with('images')->get()->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'image' => $product->images->first()?->url,
            ];
        });

        return Inertia::render('livestream/index', [
            'streams' => $streams,
            'allProducts' => $allProducts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['exists:products,id'],
        ]);

        $streamData = Livekit::createRoom($validated['title']);

        $livestream = LiveStream::create([
            'title' => $validated['title'],
            'ws_url' => $streamData['ws_url'],
            'stream_key' => $streamData['stream_key'],
            'ingress_id' => $streamData['ingress_id'],
            's3_path' => $streamData['s3_path'],
        ]);

        // Sync products if provided
        if (!empty($validated['product_ids'])) {
            $livestream->products()->sync($validated['product_ids']);
        }

        return redirect()
            ->route('livestream.index')
            ->with('success', 'Livestream created successfully.')
            ->with('createdStream', [
                'ws_url' => $livestream->ws_url,
                'stream_key' => $livestream->stream_key,
            ]);
    }
}
