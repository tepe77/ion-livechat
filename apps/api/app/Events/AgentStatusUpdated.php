<?php

namespace App\Events;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AgentStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $agentId,
        public AgentPresence $presence,
        public AgentAvailability $availability,
        public int $activeConversations = 0,
        public int $maxConcurrentConversations = 5
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('agent.' . $this->agentId),
            new PrivateChannel('manager.dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'agent.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'agent_id' => $this->agentId,
            'presence' => $this->presence->value,
            'availability' => $this->availability->value,
            'active_conversations' => $this->activeConversations,
            'max_concurrent_conversations' => $this->maxConcurrentConversations,
        ];
    }
}
