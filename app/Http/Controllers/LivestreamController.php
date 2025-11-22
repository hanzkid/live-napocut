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

        return Inertia::render('livestream/index', [
            'streams' => $streams,
        ]);
    }

    public function show(LiveStream $livestream): Response
    {
        $livestream->load('products.images');

        $formattedLivestream = [
            'id' => $livestream->id,
            'title' => $livestream->title,
            'ws_url' => $livestream->ws_url,
            'stream_key' => $livestream->stream_key,
            'ingress_id' => $livestream->ingress_id,
            's3_path' => $livestream->s3_path,
            'is_active' => $livestream->is_active,
            'created_at' => $livestream->created_at,
            'updated_at' => $livestream->updated_at,
            'products' => $livestream->products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->formatted_price,
                    'link' => $product->link,
                    'image' => $product->images->first()?->url,
                ];
            }),
        ];

        return Inertia::render('livestream/show', [
            'livestream' => $formattedLivestream,
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

    public function attachProduct(Request $request, LiveStream $livestream)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        // Check if product is already attached
        if ($livestream->products()->where('product_id', $validated['product_id'])->exists()) {
            return response()->json(['message' => 'Product already attached'], 400);
        }

        $livestream->products()->attach($validated['product_id']);

        return response()->json(['message' => 'Product attached successfully']);
    }

    public function detachProduct(LiveStream $livestream, int $productId)
    {
        $livestream->products()->detach($productId);

        return response()->json(['message' => 'Product removed successfully']);
    }
}
