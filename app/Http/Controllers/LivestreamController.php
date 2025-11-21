<?php

namespace App\Http\Controllers;

use App\Models\LiveStream;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\Livekit;

class LivestreamController extends Controller
{
    public function index(): Response
    {
        $streams = LiveStream::select([
            'id',
            'title',
            'ws_url',
            'stream_key'
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
            's3_path' => $streamData['s3_path'],
        ]);

        return redirect()
            ->route('livestream.index')
            ->with('success', 'Livestream created successfully.');
    }
}
