<?php

namespace App\Services;

use Agence104\LiveKit\EgressServiceClient;
use Agence104\LiveKit\IngressServiceClient;
use Agence104\LiveKit\RoomCreateOptions;
use Agence104\LiveKit\RoomServiceClient;
use Livekit\EncodingOptions;
use Livekit\IngressInput;
use Livekit\IngressAudioEncodingOptions;
use Livekit\IngressAudioOptions;
use Livekit\IngressVideoEncodingOptions;
use Livekit\IngressVideoOptions;
use Livekit\VideoCodec;
use Livekit\AudioCodec;
use Livekit\VideoLayer;
use Livekit\S3Upload;
use Livekit\SegmentedFileOutput;
use Livekit\SegmentedFileProtocol;

class Livekit
{
    /**
     * Stop existing egresses by IDs
     * 
     * @param array $egressIds Array of egress IDs to stop
     */
    public static function stopEgress(array $egressIds): void
    {
        $egressService = new EgressServiceClient(
            config('livekit.api_url'),
            config('livekit.api_key'),
            config('livekit.api_secret'),
        );

        foreach ($egressIds as $id) {
            try {
                $egressService->stopEgress($id);
            } catch (\Exception $e) {
                \Log::warning("Failed to stop egress {$id}: {$e->getMessage()}");
            }
        }
    }

    /**
     * List active egress
     */
    public static function listActiveEgressId()
    {
        $egressService = new EgressServiceClient(
            config('livekit.api_url'),
            config('livekit.api_key'),
            config('livekit.api_secret'),
        );

        $listEgress = iterator_to_array($egressService->listEgress('', '', true)->getItems());

        $egressId = [];

        foreach ($listEgress as $egress) {
            $egressId[] = $egress->getEgressId();
        }

        return $egressId;
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
        $options->setVideoBitrate(6000);    // 6 Mbps for high quality
        $options->setAudioBitrate(256);     // 256 kbps for high quality audio
        $options->setAudioFrequency(48000); // 48 kHz audio
        $options->setVideoCodec(VideoCodec::H264_HIGH); // H264 High profile
        $options->setAudioCodec(AudioCodec::AAC); // AAC required for HLS
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

        // Configure video encoding for portrait 1080p HIGH quality (1080x1920)
        $videoLayer = new VideoLayer();
        $videoLayer->setWidth(1080);           // Portrait width
        $videoLayer->setHeight(1920);          // Portrait height (1080p)
        $videoLayer->setBitrate(6000000);      // 6 Mbps for high quality (matching HIGH preset)

        $videoEncodingOptions = new IngressVideoEncodingOptions();
        $videoEncodingOptions->setVideoCodec(VideoCodec::H264_HIGH);
        $videoEncodingOptions->setFrameRate(30);
        $videoEncodingOptions->setLayers([$videoLayer]);

        $videoOptions = new IngressVideoOptions();
        $videoOptions->setOptions($videoEncodingOptions);

        // Configure audio encoding to match egress (256 kbps, AAC codec)
        $audioEncodingOptions = new IngressAudioEncodingOptions();
        $audioEncodingOptions->setAudioCodec(AudioCodec::AAC);
        $audioEncodingOptions->setBitrate(256000);  // 256 kbps
        $audioEncodingOptions->setChannels(2);      // Stereo

        $audioOptions = new IngressAudioOptions();
        $audioOptions->setOptions($audioEncodingOptions);

        $ingress = $ingressService->createIngress(
            IngressInput::RTMP_INPUT,
            $roomName,
            $roomName,
            'streamer-obs',
            'Streamer (OBS)',
            $audioOptions,  // audio options (256 kbps AAC)
            $videoOptions  // video options with 1080p HIGH preset
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
