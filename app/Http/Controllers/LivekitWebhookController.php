<?php

namespace App\Http\Controllers;

use Agence104\LiveKit\WebhookReceiver;
use App\Models\LiveStream;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LivekitWebhookController extends Controller
{
    /**
     * Handle incoming LiveKit webhook events
     */
    public function handle(Request $request)
    {
        try {
            // Get the raw body and authorization header
            $body = $request->getContent();
            $authHeader = $request->header('Authorization');

            // Verify and decode the webhook using LiveKit SDK
            $receiver = new WebhookReceiver(
                config('livekit.api_key'),
                config('livekit.api_secret')
            );

            $event = $receiver->receive($body, $authHeader);

            // Handle different event types
            switch ($event->getEvent()) {
                case 'ingress_started':
                    $this->handleIngressStarted($event);
                    break;

                case 'ingress_ended':
                    $this->handleIngressEnded($event);
                    break;

                default:
                // Unknown event type, no action needed
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

    /**
     * Handle ingress_started event
     */
    private function handleIngressStarted($event)
    {
        $ingressInfo = $event->getIngressInfo();
        $ingressId = $ingressInfo->getIngressId();
        $roomName = $ingressInfo->getRoomName();

        $livestream = LiveStream::where('ingress_id', $ingressId)->first();

        if ($livestream) {
            // Start egress when ingress actually starts
            try {
                $s3PathPrefix = $livestream->id . '-' . Str::random(8) . '/';
                $egressId = \App\Services\Livekit::startEgressForRoom($roomName, $s3PathPrefix);

                $livestream->update([
                    'is_active' => true,
                    'started_at' => now(),
                    'egress_id' => $egressId,
                    's3_path' => $s3PathPrefix . 'live.m3u8',
                ]);

            } catch (\Exception $e) {
                Log::error("Failed to start egress for livestream {$livestream->id}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Handle ingress_ended event
     */
    private function handleIngressEnded($event)
    {
        $ingressInfo = $event->getIngressInfo();
        $ingressId = $ingressInfo->getIngressId();

        $livestream = LiveStream::where('ingress_id', $ingressId)->first();

        if ($livestream) {
            if ($livestream->egress_id) {
                try {
                    \App\Services\Livekit::stopEgress($livestream->egress_id);
                    $livestream->update([
                        'is_active' => false,
                        'ended_at' => now(),
                    ]);
                    event(new \App\Events\LivestreamEnded());
                } catch (\Exception $e) {
                    Log::error("Failed to stop egress {$livestream->egress_id}: {$e->getMessage()}");
                }
            }
        }
    }
}
