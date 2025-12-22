<?php

namespace App\Http\Controllers;

use Agence104\LiveKit\WebhookReceiver;
use App\Jobs\ProcessIngressEnded;
use App\Models\LiveStream;
use App\Services\Livekit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LivekitWebhookController extends Controller
{
    public function handle(Request $request)
    {
        try {
            $body = $request->getContent();
            $authHeader = $request->header('Authorization');

            $receiver = new WebhookReceiver(
                config('livekit.api_key'),
                config('livekit.api_secret')
            );

            $event = $receiver->receive($body, $authHeader);

            switch ($event->getEvent()) {
                case 'ingress_started':
                    $this->handleIngressStarted($event);
                    break;

                case 'ingress_ended':
                    $this->handleIngressEnded($event);
                    break;

                default:
            }

            return response()->json(['success' => true], 200);

        } catch (\Exception $e) {
            Log::error('LiveKit webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    private function handleIngressStarted($event)
    {
        $ingressInfo = $event->getIngressInfo();
        $ingressId = $ingressInfo->getIngressId();
        $roomName = $ingressInfo->getRoomName();

        $cacheKey = "ingress_ended_pending:{$ingressId}";
        if (Cache::has($cacheKey)) {
            Cache::forget($cacheKey);
            Log::info("Cancelled pending ingress_ended processing for ingress {$ingressId} due to ingress_started");
            return;
        }

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
                $egressId = Livekit::startEgressForRoom($roomName, $s3PathPrefix, $configuration);

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

    private function handleIngressEnded($event)
    {
        $ingressInfo = $event->getIngressInfo();
        $ingressId = $ingressInfo->getIngressId();

        $livestream = LiveStream::where('ingress_id', $ingressId)->first();

        if ($livestream && $livestream->egress_id) {
            $cacheKey = "ingress_ended_pending:{$ingressId}";
            Cache::put($cacheKey, now(), now()->addSeconds(120));

            ProcessIngressEnded::dispatch($ingressId)
                ->delay(now()->addSeconds(60));

            Log::info("Scheduled ingress_ended processing for ingress {$ingressId} after 60s grace period");
        }
    }
}
