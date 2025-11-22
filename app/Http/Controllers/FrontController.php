<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\VideoGrant;

class FrontController extends Controller
{
    //
    public function livestream()
    {
        $livekit = config('livekit');
        $token = session('livekit_token');

        return Inertia::render('live', [
            'livekit_ws_url' => $livekit['ws_url'],
            'livekit_token' => $token,
        ]);
    }

    public function joinLivestream(Request $request)
    {
        $livekit = config('livekit');
        $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $roomName = 'name-of-room';
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

        session(['livekit_token' => $token]);

        return redirect()->route('live');
    }
}
