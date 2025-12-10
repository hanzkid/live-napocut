<?php

namespace App\Services;

use Agence104\LiveKit\IngressServiceClient;
use Agence104\LiveKit\RoomCreateOptions;
use Agence104\LiveKit\RoomServiceClient;
use Illuminate\Support\Str;
use Livekit\AutoParticipantEgress;
use Livekit\IngressInput;
use Livekit\RoomEgress;
use Livekit\S3Upload;
use Livekit\SegmentedFileOutput;
use Livekit\SegmentedFileProtocol;

class Livekit
{
    public static function createRoom(string $roomName)
    {
        $roomService = new RoomServiceClient(
            config('livekit.api_url'),
            config('livekit.api_key'),
            config('livekit.api_secret'),
        );

        // Configure S3 upload
        $s3 = new S3Upload([
            'access_key' => config('livekit.s3_access_key'),
            'secret' => config('livekit.s3_secret'),
            'region' => config('livekit.s3_region'),
            'bucket' => config('livekit.s3_bucket'),
            'endpoint' => config('livekit.s3_endpoint'),
            'force_path_style' => true,
        ]);

        // Configure HLS segmented output for livestreaming (live only, no VOD recording)
        // Using 1-second segments for lower latency (LL-HLS approach)
        $s3Path = Str::uuid().'/';
        $segmentedOutput = new SegmentedFileOutput([
            'filename_prefix' => $s3Path,
            'live_playlist_name' => 'live.m3u8',
            'segment_duration' => 3, // Reduced from 3s to 1s for lower latency
            'protocol' => SegmentedFileProtocol::HLS_PROTOCOL,
        ]);
        $segmentedOutput->setS3($s3);

        // Configure automatic participant egress (records each participant's stream as HLS)
        $participantEgress = new AutoParticipantEgress([
            'segment_outputs' => [$segmentedOutput],
        ]);

        // Configure room egress
        $roomEgress = new RoomEgress;
        $roomEgress->setParticipant($participantEgress);

        // Create room with egress configuration
        $opts = (new RoomCreateOptions)
            ->setName($roomName)
            ->setMetadata(json_encode([]))
            ->setEgress($roomEgress);

        $room = $roomService->createRoom($opts);

        // Create RTMP ingress
        $ingressService = new IngressServiceClient(
            config('livekit.api_url'),
            config('livekit.api_key'),
            config('livekit.api_secret'),
        );

        $ingress = $ingressService->createIngress(
            IngressInput::RTMP_INPUT,
            $roomName,              // name
            $roomName,              // roomName
            'streamer-obs',         // participantIdentity
            'Streamer (OBS)'        // participantName
        );

        return [
            'ws_url' => $ingress->getUrl(),
            'stream_key' => $ingress->getStreamKey(),
            'ingress_id' => $ingress->getIngressId(),
            's3_path' => $s3Path.'live.m3u8',
        ];
    }
}
