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
            'started_at',
            'ended_at',
            'created_at',
        ])->latest()->get();

        return Inertia::render('livestream/index', [
            'streams' => $streams,
        ]);
    }

    public function show(LiveStream $livestream): Response
    {
        $formattedLivestream = [
            'id' => $livestream->id,
            'title' => $livestream->title,
            'ws_url' => $livestream->ws_url,
            'stream_key' => $livestream->stream_key,
            'ingress_id' => $livestream->ingress_id,
            's3_path' => $livestream->s3_path,
            'is_active' => $livestream->is_active,
            'started_at' => $livestream->started_at,
            'ended_at' => $livestream->ended_at,
            'created_at' => $livestream->created_at,
            'updated_at' => $livestream->updated_at,
        ];

        return Inertia::render('livestream/show', [
            'livestream' => $formattedLivestream,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'inputMode' => ['nullable', 'string', 'in:rtmp,whip'],
            'resolutionWidth' => ['nullable', 'integer', 'min:1'],
            'resolutionHeight' => ['nullable', 'integer', 'min:1'],
            'bitrate' => ['nullable', 'integer', 'min:1'],
        ]);

        $inputMode = $validated['inputMode'] ?? 'rtmp';
        $configuration = [
            'input_mode' => $inputMode,
            'resolution_width' => $validated['resolutionWidth'],
            'resolution_height' => $validated['resolutionHeight'],
            'bitrate' => $validated['bitrate'],
        ];

        // only create room with alphanumeric characters
        $roomName = preg_replace('/[^a-zA-Z0-9]/', '', $validated['title']);
        $streamData = Livekit::createRoom($roomName, $configuration);

        $livestream = LiveStream::create([
            'title' => $validated['title'],
            'ws_url' => $streamData['ws_url'],
            'stream_key' => $streamData['stream_key'],
            'ingress_id' => $streamData['ingress_id'],
            'egress_id' => $streamData['egress_id'],
            's3_path' => $streamData['s3_path'],
            'resolution_width' => $validated['resolutionWidth'],
            'resolution_height' => $validated['resolutionHeight'],
            'bitrate' => $validated['bitrate'],
        ]);

        return redirect()
            ->route('livestream.index')
            ->with('success', 'Livestream created successfully.')
            ->with('createdStream', [
                'ws_url' => $livestream->ws_url,
                'stream_key' => $livestream->stream_key,
            ]);
    }
}
