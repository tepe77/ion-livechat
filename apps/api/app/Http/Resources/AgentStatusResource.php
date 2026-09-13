<?php

namespace App\Http\Resources;

use App\Enums\ConversationStatus;
use App\Models\AgentProfile;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgentStatusResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = AgentProfile::where('user_id', $this->agent_id)->first();
        $activeCount = Conversation::where('agent_id', $this->agent_id)
            ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
            ->count();

        return [
            'presence' => $this->presence->value,
            'availability' => $this->availability->value,
            'active_conversations' => $activeCount,
            'max_concurrent_conversations' => $profile?->max_concurrent_conversations ?? 5,
            'last_seen_at' => $this->last_seen_at?->toISOString(),
            'available_since' => $this->available_since?->toISOString(),
        ];
    }
}
