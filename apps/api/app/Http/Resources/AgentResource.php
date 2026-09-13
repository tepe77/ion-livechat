<?php

namespace App\Http\Resources;

use App\Enums\ConversationStatus;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $status = $this->agentStatus;
        $profile = $this->agentProfile;

        $activeCount = Conversation::where('agent_id', $this->id)
            ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
            ->count();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'is_active' => $this->is_active,
            'presence' => $status?->presence?->value ?? 'offline',
            'availability' => $status?->availability?->value ?? 'available',
            'active_conversations' => $activeCount,
            'max_concurrent_conversations' => $profile?->max_concurrent_conversations ?? 5,
            'last_seen_at' => $status?->last_seen_at?->toISOString(),
            'available_since' => $status?->available_since?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
