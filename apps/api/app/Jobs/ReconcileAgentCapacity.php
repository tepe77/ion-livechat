<?php

namespace App\Jobs;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\ConversationStatus;
use App\Events\AgentStatusUpdated;
use App\Models\AgentProfile;
use App\Models\AgentStatus;
use App\Models\Conversation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ReconcileAgentCapacity implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $onlineAgents = AgentStatus::where('presence', AgentPresence::ONLINE)->get();

        foreach ($onlineAgents as $status) {
            $activeCount = Conversation::where('agent_id', $status->agent_id)
                ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
                ->count();

            $profile = AgentProfile::where('user_id', $status->agent_id)->first();
            $maxCapacity = $profile ? $profile->max_concurrent_conversations : 5;

            // Auto-adjust status if at or below capacity
            if ($activeCount >= $maxCapacity && $status->availability === AgentAvailability::AVAILABLE) {
                $status->update(['availability' => AgentAvailability::BUSY]);
                event(new AgentStatusUpdated(
                    $status->agent_id,
                    AgentPresence::ONLINE,
                    AgentAvailability::BUSY,
                    $activeCount,
                    $maxCapacity
                ));
            } elseif ($activeCount < $maxCapacity && $status->availability === AgentAvailability::BUSY) {
                $status->update(['availability' => AgentAvailability::AVAILABLE]);
                event(new AgentStatusUpdated(
                    $status->agent_id,
                    AgentPresence::ONLINE,
                    AgentAvailability::AVAILABLE,
                    $activeCount,
                    $maxCapacity
                ));
            }
        }
    }
}
