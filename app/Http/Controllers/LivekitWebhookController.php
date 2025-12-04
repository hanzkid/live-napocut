<?php

namespace App\Http\Controllers;

use Agence104\LiveKit\WebhookReceiver;
use App\Models\LiveStream;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        $livestream = LiveStream::where('ingress_id', $ingressId)->first();

        if ($livestream) {
            $livestream->update([
                'is_active' => true,
                'started_at' => now(),
            ]);
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
            $livestream->update([
                'is_active' => false,
                'ended_at' => now(),
            ]);
        }
    }
}
