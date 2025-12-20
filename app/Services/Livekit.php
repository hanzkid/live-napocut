<?php

namespace App\Services;

use Agence104\LiveKit\EgressServiceClient;
use Agence104\LiveKit\IngressServiceClient;
use Agence104\LiveKit\RoomCreateOptions;
use Agence104\LiveKit\RoomServiceClient;
use App\Models\LiveStream;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Livekit\AudioCodec;
use Livekit\EncodingOptions;
use Livekit\IngressAudioEncodingOptions;
use Livekit\IngressAudioOptions;
use Livekit\IngressInput;
use Livekit\IngressVideoEncodingOptions;
use Livekit\IngressVideoOptions;
use Livekit\S3Upload;
use Livekit\SegmentedFileOutput;
use Livekit\SegmentedFileProtocol;
use Livekit\VideoCodec;
use Livekit\VideoLayer;
use Livekit\VideoQuality;

class Livekit
{
    /**
     * Stop existing egresses by IDs
     *
     * @param  array  $egressIds  Array of egress IDs to stop
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
    public static function startEgressForRoom(string $roomName, string $s3Path, array $configuration): string
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
        $options->setWidth($configuration['resolution_width']);           // Portrait width
        $options->setHeight($configuration['resolution_height']);          // Portrait height (1080p)
        $options->setVideoBitrate($configuration['bitrate']);    // 6 Mbps for high quality
        $options->setVideoQuality(VideoQuality::HIGH);
        $options->setAudioBitrate(256);     // 256 kbps for high quality audio
        $options->setAudioFrequency(48000); // 48 kHz audio
        $options->setVideoCodec(VideoCodec::H264_HIGH); // H264 High profile
        $options->setAudioCodec(AudioCodec::AAC); // AAC required for HLS
        $options->setFramerate(30);         // 30 fps
        $options->setKeyFrameInterval(3); // 3 seconds key frame interval

        $egress = $egressService->startRoomCompositeEgress(
            $roomName,
            'single-speaker',
            $segmentedOutput,
            $options,
            false
        );

        return $egress->getEgressId();
    }

    public static function createRoom(string $roomName, array $configuration)
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

        $ingressInput = 0;
        $bypassTranscoding = false;
        $videoOptions = null;
        $audioOptions = null;

        switch ($configuration['input_mode']) {
            case 'whip':
                $bypassTranscoding = true;
                $videoOptions = null;
                $audioOptions = null;
                $ingressInput = IngressInput::WHIP_INPUT;
                break;
            case 'rtmp':
            default:
                $videoLayer = new VideoLayer;
                $videoLayer->setWidth($configuration['resolution_width']);
                $videoLayer->setHeight($configuration['resolution_height']);
                $videoLayer->setBitrate($configuration['bitrate'] * 1000);
                $videoLayer->setQuality(VideoQuality::HIGH);

                $videoEncodingOptions = new IngressVideoEncodingOptions;
                $videoEncodingOptions->setFrameRate(30);
                $videoEncodingOptions->setLayers([$videoLayer]);
                // $videoEncodingOptions->setVideoCodec(VideoCodec::H264_HIGH);

                $videoOptions = new IngressVideoOptions;
                $videoOptions->setOptions($videoEncodingOptions);

                $audioEncodingOptions = new IngressAudioEncodingOptions;
                $audioEncodingOptions->setBitrate(256000);  // 256 kbps

                $audioOptions = new IngressAudioOptions;
                $audioOptions->setOptions($audioEncodingOptions);

                $bypassTranscoding = false;
                $ingressInput = IngressInput::RTMP_INPUT;
                break;
        }

        $ingress = $ingressService->createIngress(
            $ingressInput,
            $roomName,
            $roomName,
            'streamer-obs',
            'Streamer (OBS)',
            $audioOptions,
            $videoOptions,
            $bypassTranscoding
        );

        return [
            'ws_url' => $ingress->getUrl(),
            'stream_key' => $ingress->getStreamKey(),
            'ingress_id' => $ingress->getIngressId(),
            'egress_id' => null,
            's3_path' => null,
        ];
    }

    public static function startEgressManually($ingressId)
    {
        $livestream = LiveStream::where('ingress_id', $ingressId)->first();

        if ($livestream) {
            try {
                $s3PathPrefix = $livestream->id.'-'.Str::random(8).'/';
                $activeEgressID = Livekit::listActiveEgressId();
                $configuration = [
                    'resolution_width' => $livestream->resolution_width,
                    'resolution_height' => $livestream->resolution_height,
                    'bitrate' => $livestream->bitrate,
                ];
                $egressId = Livekit::startEgressForRoom($livestream->title, $s3PathPrefix, $configuration);

                $livestream->update([
                    'is_active' => true,
                    'started_at' => now(),
                    'egress_id' => $egressId,
                    's3_path' => $s3PathPrefix.'live.m3u8',
                ]);
                Livekit::stopEgress($activeEgressID);
            } catch (\Exception $e) {
                Log::error("Failed to start egress for livestream {$livestream->id}: {$e->getMessage()}");
            }
        }
    }
}
