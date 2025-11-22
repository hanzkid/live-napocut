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
        ])->latest()->get();

        return Inertia::render('livestream/index', [
            'streams' => $streams,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $streamData = Livekit::createRoom($validated['title']);

        LiveStream::create([
            'title' => $validated['title'],
            'ws_url' => $streamData['ws_url'],
            'stream_key' => $streamData['stream_key'],
            'ingress_id' => $streamData['ingress_id'],
            's3_path' => $streamData['s3_path'],
        ]);

        return redirect()
            ->route('livestream.index')
            ->with('success', 'Livestream created successfully.');
    }
}
