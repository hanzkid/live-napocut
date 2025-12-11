<?php

namespace App\Services;

use Agence104\LiveKit\EgressServiceClient;
use Agence104\LiveKit\IngressServiceClient;
use Agence104\LiveKit\RoomCreateOptions;
use Agence104\LiveKit\RoomServiceClient;
use Livekit\EncodingOptions;
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
            \Log::warning("Failed to stop egress {$egressId}: {$e->getMessage()}");
        }
    }

    /**
     * Start egress for a room with given S3 path
     */
    public static function startEgressForRoom(string $roomName, string $s3Path): string
    {
        $s3 = new S3Upload([
            'access_key' => config('livekit.s3_access_key'),
            'secret' => config('livekit.s3_secret'),
            'region' => config('livekit.s3_region'),
            'bucket' => config('livekit.s3_bucket'),
            'endpoint' => config('livekit.s3_endpoint'),
            'force_path_style' => true,
        ]);

        $segmentedOutput = new SegmentedFileOutput([
            'filename_prefix' => $s3Path,
            'live_playlist_name' => 'live.m3u8',
            'segment_duration' => 3,
            'protocol' => SegmentedFileProtocol::HLS_PROTOCOL,
        ]);
        $segmentedOutput->setS3($s3);

        $egressService = new EgressServiceClient(
            config('livekit.api_url'),
            config('livekit.api_key'),
            config('livekit.api_secret'),
        );

        // Custom encoding options for high quality 1080p portrait
        $options = new EncodingOptions;
        $options->setWidth(1080);           // Portrait width
        $options->setHeight(1920);          // Portrait height (1080p)
        $options->setVideoBitrate(8000);    // 8 Mbps for high quality
        $options->setAudioBitrate(256);     // 256 kbps for high quality audio
        $options->setAudioFrequency(48000); // 48 kHz audio
        $options->setVideoCodec(\Livekit\VideoCodec::H264_HIGH); // H264 High profile
        $options->setAudioCodec(\Livekit\AudioCodec::AAC); // AAC required for HLS
        $options->setFramerate(30);         // 30 fps

        $egress = $egressService->startRoomCompositeEgress(
            $roomName,
            'single-speaker',
            $segmentedOutput,
            $options,
            false
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

        $opts = (new RoomCreateOptions)
            ->setName($roomName)
            ->setMetadata(json_encode([]));

        $room = $roomService->createRoom($opts);

        $ingressService = new IngressServiceClient(
            config('livekit.api_url'),
            config('livekit.api_key'),
            config('livekit.api_secret'),
        );

        $ingress = $ingressService->createIngress(
            IngressInput::RTMP_INPUT,
            $roomName,
            $roomName,
            'streamer-obs',
            'Streamer (OBS)'
        );

        return [
            'ws_url' => $ingress->getUrl(),
            'stream_key' => $ingress->getStreamKey(),
            'ingress_id' => $ingress->getIngressId(),
            'egress_id' => null,
            's3_path' => null,
        ];
    }
}
