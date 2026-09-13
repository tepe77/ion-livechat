<?php

namespace App\Events;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationTransferred implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Conversation $conversation,
        public User $newAgent
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->conversation->id),
            new PrivateChannel('agent.' . $this->newAgent->id),
            new PrivateChannel('manager.dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'conversation.transferred';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversation->id,
            'agent' => [
                'id' => $this->newAgent->id,
                'name' => $this->newAgent->name,
                'avatar' => $this->newAgent->avatar,
            ],
            'transferred_at' => now()->toISOString(),
        ];
    }
}
