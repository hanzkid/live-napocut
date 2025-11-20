<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\VideoGrant;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';

Route::get('live', function () {
    $livekit = config('livekit');
    $token = session('livekit_token');
    return Inertia::render('live',[
        'livekit_ws_url' => $livekit['ws_url'],
        'livekit_token' => $token
    ]);
})->name('live');

Route::post('live', function (Request $request) {
    $livekit = config('livekit');
    $request->validate([
        'name' => ['nullable', 'string', 'max:255'],
    ]);

    $roomName = 'name-of-room';
    $participantName = $request->input('name') ?: optional($request->user())->name ?: 'Guest';
    
    // Define the token options.
    $tokenOptions = (new AccessTokenOptions())
      ->setIdentity($participantName);
    
    // Define the video grants.
    $videoGrant = (new VideoGrant())
      ->setRoomJoin()
      ->setRoomName($roomName);
    
    // Initialize and fetch the JWT Token.
    $token = (new AccessToken($livekit['api_key'], $livekit['api_secret']))
      ->init($tokenOptions)
      ->setGrant($videoGrant)
      ->toJwt();
    
    session(['livekit_token' => $token]);

    return redirect()->route('live');
});