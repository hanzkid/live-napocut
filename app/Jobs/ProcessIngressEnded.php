<?php

namespace App\Jobs;

use App\Events\LivestreamEnded;
use App\Models\LiveStream;
use App\Services\Livekit;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProcessIngressEnded implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $ingressId
    ) {}

    public function handle(): void
    {
        $cacheKey = "ingress_ended_pending:{$this->ingressId}";

        if (! Cache::has($cacheKey)) {
            Log::info("Ingress {$this->ingressId} restarted, cancelling ingress_ended processing");
            return;
        }

        $cacheTimer = Cache::get($cacheKey, now());
        if (abs(now()->diffInSeconds($cacheTimer)) < 59) {
            Log::info("Ingress {$this->ingressId} restarted, cancelling ingress_ended processing");
            return;
        }

        $livestream = LiveStream::where('ingress_id', $this->ingressId)->first();

        if ($livestream) {
            if ($livestream->egress_id) {
                try {
                    Livekit::stopEgress([$livestream->egress_id]);
                    $livestream->update([
                        'is_active' => false,
                        'ended_at' => now(),
                    ]);
                    event(new LivestreamEnded);
                    Cache::forget($cacheKey);
                    Log::info("Removed cache key {$cacheKey} after processing ingress_ended");
                } catch (\Exception $e) {
                    Log::error("Failed to stop egress {$livestream->egress_id}: {$e->getMessage()}");
                }
            }
        }
    }
}
