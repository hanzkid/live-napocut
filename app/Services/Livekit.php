<?php

namespace App\Services;

use Agence104\LiveKit\RoomServiceClient;
use Agence104\LiveKit\RoomCreateOptions;
use Agence104\LiveKit\IngressServiceClient;

use Illuminate\Support\Str;
use Livekit\S3Upload;
use Livekit\SegmentedFileOutput;
use Livekit\SegmentedFileProtocol;
use Livekit\AutoParticipantEgress;
use Livekit\RoomEgress;
use Livekit\IngressInput;

class Livekit
{
    public static function createRoom(string $roomName)
    {
        $roomService = new RoomServiceClient(
            config("livekit.api_url"),
            config("livekit.api_key"),
            config("livekit.api_secret"),
        );

        // Configure S3 upload
        $s3 = new S3Upload([
            'access_key' => config("livekit.s3_access_key"),
            'secret' => config("livekit.s3_secret"),
            'region' => config("livekit.s3_region"),
            'bucket' => config("livekit.s3_bucket"),
            'endpoint' => config("livekit.s3_endpoint"),
            'force_path_style' => true,
        ]);

        // Configure HLS segmented output for livestreaming (live only, no VOD recording)
        $s3Path = $roomName . '-' . Str::random(8) . '/';
        $segmentedOutput = new SegmentedFileOutput([
            'filename_prefix' => $s3Path,
            'live_playlist_name' => 'live.m3u8',
            'segment_duration' => 3,
            'protocol' => SegmentedFileProtocol::HLS_PROTOCOL,
        ]);
        $segmentedOutput->setS3($s3);

        // Configure automatic participant egress (records each participant's stream as HLS)
        $participantEgress = new AutoParticipantEgress([
            'segment_outputs' => [$segmentedOutput],
        ]);

        // Configure room egress
        $roomEgress = new RoomEgress();
        $roomEgress->setParticipant($participantEgress);

        // Create room with egress configuration
        $opts = (new RoomCreateOptions())
            ->setName($roomName)
            ->setMetadata(json_encode([]))
            ->setEgress($roomEgress);

        $room = $roomService->createRoom($opts);

        // Create RTMP ingress
        $ingressService = new IngressServiceClient(
            config("livekit.api_url"),
            config("livekit.api_key"),
            config("livekit.api_secret"),
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
            's3_path' => $s3Path . '/live.m3u8',
        ];
    }
}
