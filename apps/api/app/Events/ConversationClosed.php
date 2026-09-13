<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationClosed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Conversation $conversation
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('conversation.' . $this->conversation->id),
            new PrivateChannel('manager.dashboard'),
        ];

        if ($this->conversation->agent_id) {
            $channels[] = new PrivateChannel('agent.' . $this->conversation->agent_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'conversation.closed';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversation->id,
            'closed_at' => $this->conversation->closed_at?->toISOString() ?? now()->toISOString(),
            'rating_available' => true,
        ];
    }
}
