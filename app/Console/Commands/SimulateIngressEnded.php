<?php

namespace App\Console\Commands;

use App\Events\LivestreamEnded;
use App\Models\LiveStream;
use Illuminate\Console\Command;

class SimulateIngressEnded extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'livekit:simulate-ingress-ended {ingress_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Simulate LiveKit ingress_ended webhook event';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $ingressId = $this->argument('ingress_id');

        if ($ingressId) {
            // Find specific livestream by ingress_id
            $livestream = LiveStream::where('ingress_id', $ingressId)->first();

            if (! $livestream) {
                $this->error("No livestream found with ingress_id: {$ingressId}");

                return Command::FAILURE;
            }
        } else {
            // Find the most recent active livestream
            $livestream = LiveStream::where('is_active', true)
                ->latest()
                ->first();

            if (! $livestream) {
                $this->error('No active livestream found');

                return Command::FAILURE;
            }
        }

        $this->info("Simulating ingress_ended for livestream: {$livestream->title}");
        $this->info("Ingress ID: {$livestream->ingress_id}");

        // Update livestream status
        $livestream->update([
            'is_active' => false,
            'ended_at' => now(),
        ]);

        // Broadcast livestream ended event
        event(new LivestreamEnded);

        $this->info('✅ Livestream ended and broadcast sent!');

        return Command::SUCCESS;
    }
}
