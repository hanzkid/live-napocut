<?php

return [
    'ws_url' => env('LIVEKIT_WS_URL'),
    'api_url' => env('LIVEKIT_API_URL'),
    'api_key' => env('LIVEKIT_API_KEY'),
    'api_secret' => env('LIVEKIT_API_SECRET'),

    's3_bucket' => env('LIVEKIT_S3_BUCKET'),
    's3_region' => env('LIVEKIT_S3_REGION'),
    's3_access_key' => env('LIVEKIT_S3_ACCESS_KEY'),
    's3_secret' => env('LIVEKIT_S3_SECRET'),
    's3_endpoint' => env('LIVEKIT_S3_ENDPOINT'),
    's3_public_url' => env('LIVEKIT_S3_PUBLIC_URL'),
];
