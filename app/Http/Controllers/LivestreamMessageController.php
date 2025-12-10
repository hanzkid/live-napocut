<?php

namespace App\Http\Controllers;

use App\Models\LiveStream;
use App\Models\LivestreamMessage;
use Illuminate\Http\Request;

class LivestreamMessageController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'livestream_id' => ['required', 'exists:live_streams,id'],
            'user_name' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $message = LivestreamMessage::create([
            'livestream_id' => $validated['livestream_id'],
            'user_name' => $validated['user_name'],
            'message' => $validated['message'],
            'sent_at' => now(),
        ]);

        return response()->noContent();
    }

    public function index(Request $request, $livestreamId)
    {
        $livestream = LiveStream::findOrFail($livestreamId);

        $messages = LivestreamMessage::where('livestream_id', $livestream->id)
            ->orderBy('sent_at', 'asc')
            ->limit(100) // Last 100 messages
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'user_name' => $message->user_name,
                    'message' => $message->message,
                    'sent_at' => $message->sent_at->toIso8601String(),
                ];
            });

        return response()->json($messages);
    }
}
