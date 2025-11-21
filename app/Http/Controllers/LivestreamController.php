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
            'stream_key',
            'created_at',
            'updated_at',
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

        $room = Livekit::createRoom($validated['title']);
        dd($room);

        LiveStream::create($validated);

        return redirect()
            ->route('livestream.index')
            ->with('success', 'Livestream created successfully.');
    }
}
