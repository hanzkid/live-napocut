<?php

namespace App\Services;

use Agence104\LiveKit\EgressServiceClient;
use Agence104\LiveKit\IngressServiceClient;
use Agence104\LiveKit\RoomCreateOptions;
use Agence104\LiveKit\RoomServiceClient;
use Livekit\EncodingOptions;
use Livekit\EncodingOptionsPreset;
use Livekit\IngressInput;
use Livekit\S3Upload;
use Livekit\SegmentedFileOutput;
use Livekit\SegmentedFileProtocol;

class Livekit
{
    /**
     * Stop an existing egress by ID
     */
    public static function stopEgress(string $egressId): void
    {
        $egressService = new EgressServiceClient(
            config('livekit.api_url'),
            config('livekit.api_key'),
            config('livekit.api_secret'),
        );

        try {
            $egressService->stopEgress($egressId);
        } catch (\Exception $e) {
            // Egress may already be stopped or not exist
            \Log::warning("Failed to stop egress {$egressId}: {$e->getMessage()}");
        }
    }

    /**
     * Start egress for a room with given S3 path
     */
    public static function startEgressForRoom(string $roomName, string $s3Path): string
    {
        // Configure S3 upload
        $s3 = new S3Upload([
            'access_key' => config('livekit.s3_access_key'),
            'secret' => config('livekit.s3_secret'),
            'region' => config('livekit.s3_region'),
            'bucket' => config('livekit.s3_bucket'),
            'endpoint' => config('livekit.s3_endpoint'),
            'force_path_style' => true,
        ]);

        // Configure HLS segmented output
        $segmentedOutput = new SegmentedFileOutput([
            'filename_prefix' => $s3Path,
            'live_playlist_name' => 'live.m3u8',
            'segment_duration' => 3,
            'protocol' => SegmentedFileProtocol::HLS_PROTOCOL,
        ]);
        $segmentedOutput->setS3($s3);

        // Start room composite egress
        $egressService = new EgressServiceClient(
            config('livekit.api_url'),
            config('livekit.api_key'),
            config('livekit.api_secret'),
        );

        $options = new EncodingOptions;
        $options->preset = EncodingOptionsPreset::PORTRAIT_H264_720P_30;

        $egress = $egressService->startRoomCompositeEgress(
            $roomName,
            '',  // Empty layout
            $segmentedOutput,
            $options, // Portrait 720p 30fps
            false // Not audio only
        );

        return $egress->getEgressId();
    }

    public static function createRoom(string $roomName)
    {
        $roomService = new RoomServiceClient(
            config('livekit.api_url'),
            config('livekit.api_key'),
            config('livekit.api_secret'),
        );

        // Create room WITHOUT egress - egress will be started via webhook when ingress starts
        $opts = (new RoomCreateOptions)
            ->setName($roomName)
            ->setMetadata(json_encode([]));

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
            'egress_id' => null, // Egress will be created via webhook
            's3_path' => null,
        ];
    }
}
