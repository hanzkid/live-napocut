<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct()
    {
        // No data needed - clients will refetch via API
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('products');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'updated';
    }

    /**
     * Get the data to broadcast - lightweight signal only.
     */
    public function broadcastWith(): array
    {
        return [
            'message' => 'products_updated',
        ];
    }
}

