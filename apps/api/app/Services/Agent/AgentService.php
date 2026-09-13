<?php

namespace App\Services\Agent;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\ConversationStatus;
use App\Events\AgentStatusUpdated;
use App\Models\AgentProfile;
use App\Models\AgentStatus;
use App\Models\Conversation;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Routing\WaitingQueueService;
use Illuminate\Support\Facades\Log;

class AgentService

{
    public function __construct(
        protected WaitingQueueService $waitingQueueService,
        protected AuditService $auditService
    ) {}

    /**
     * Get or create agent status.
     */
    public function getAgentStatus(User $agent): AgentStatus
    {
        return AgentStatus::firstOrCreate(
            ['agent_id' => $agent->id],
            [
                'presence' => AgentPresence::OFFLINE,
                'availability' => AgentAvailability::AVAILABLE,
            ]
        );
    }

    /**
     * Update agent availability (available, away, busy).
     */
    public function updateAvailability(User $agent, AgentAvailability $availability): AgentStatus
    {
        $status = $this->getAgentStatus($agent);
        $wasAvailable = $status->availability === AgentAvailability::AVAILABLE;

        $updates = [
            'availability' => $availability,
        ];

        // If newly available, reset available_since timestamp
        if ($availability === AgentAvailability::AVAILABLE && !$wasAvailable) {
            $updates['available_since'] = now();
        }

        $status->update($updates);

        $profile = AgentProfile::firstOrCreate(['user_id' => $agent->id], ['max_concurrent_conversations' => 5]);
        $activeCount = Conversation::where('agent_id', $agent->id)
            ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
            ->count();

        $this->auditService->log(
            $agent,
            'agent.status_changed',
            'AgentStatus',
            $status->id,
            ['availability' => $availability->value]
        );

        try {
            event(new AgentStatusUpdated(
                $agent->id,
                $status->presence,
                $availability,
                $activeCount,
                $profile->max_concurrent_conversations
            ));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast AgentStatusUpdated event', ['error' => $e->getMessage()]);
        }


        // If agent became available, process waiting queue
        if ($availability === AgentAvailability::AVAILABLE && $status->presence === AgentPresence::ONLINE) {
            $this->waitingQueueService->processWaitingConversations();
        }

        return $status;
    }

    /**
     * Record agent heartbeat to maintain presence.
     */
    public function recordHeartbeat(User $agent): AgentStatus
    {
        $status = $this->getAgentStatus($agent);

        $wasOffline = $status->presence === AgentPresence::OFFLINE;

        $status->update([
            'last_seen_at' => now(),
            'presence' => AgentPresence::ONLINE,
            'available_since' => ($status->available_since ?? now()),
        ]);

        if ($wasOffline) {
            $profile = AgentProfile::firstOrCreate(['user_id' => $agent->id], ['max_concurrent_conversations' => 5]);
            $activeCount = Conversation::where('agent_id', $agent->id)
                ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
                ->count();

            try {
                event(new AgentStatusUpdated(
                    $agent->id,
                    AgentPresence::ONLINE,
                    $status->availability,
                    $activeCount,
                    $profile->max_concurrent_conversations
                ));
            } catch (\Throwable $e) {
                Log::warning('Failed to broadcast AgentStatusUpdated event', ['error' => $e->getMessage()]);
            }

            if ($status->availability === AgentAvailability::AVAILABLE) {
                $this->waitingQueueService->processWaitingConversations();
            }
        }

        return $status;
    }

    /**
     * Mark agent as offline (e.g. upon logout or explicit sign-off).
     */
    public function setAgentOffline(User $agent): AgentStatus
    {
        $status = $this->getAgentStatus($agent);
        $status->update([
            'presence' => AgentPresence::OFFLINE,
            'last_seen_at' => now(),
        ]);

        $profile = AgentProfile::firstOrCreate(['user_id' => $agent->id], ['max_concurrent_conversations' => 5]);
        $activeCount = Conversation::where('agent_id', $agent->id)
            ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
            ->count();

        $this->auditService->log(
            $agent,
            'agent.status_changed',
            'AgentStatus',
            $status->id,
            ['presence' => AgentPresence::OFFLINE->value]
        );

        try {
            event(new AgentStatusUpdated(
                $agent->id,
                AgentPresence::OFFLINE,
                $status->availability,
                $activeCount,
                $profile->max_concurrent_conversations
            ));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast AgentStatusUpdated event on offline', ['error' => $e->getMessage()]);
        }

        return $status;
    }

    /**
     * Mark stale agents as offline if last_seen_at exceeds threshold.
     */
    public function markStaleAgentsOffline(int $thresholdSeconds = 60): int
    {
        $cutoff = now()->subSeconds($thresholdSeconds);

        $staleStatuses = AgentStatus::query()
            ->where('presence', AgentPresence::ONLINE)
            ->where(function ($query) use ($cutoff) {
                $query->whereNull('last_seen_at')
                    ->orWhere('last_seen_at', '<', $cutoff);
            })
            ->get();

        $count = 0;
        foreach ($staleStatuses as $status) {
            $status->update(['presence' => AgentPresence::OFFLINE]);
            $count++;

            $profile = AgentProfile::where('user_id', $status->agent_id)->first();
            $maxCapacity = $profile ? $profile->max_concurrent_conversations : 5;
            $activeCount = Conversation::where('agent_id', $status->agent_id)
                ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
                ->count();

            try {
                event(new AgentStatusUpdated(
                    $status->agent_id,
                    AgentPresence::OFFLINE,
                    $status->availability,
                    $activeCount,
                    $maxCapacity
                ));
            } catch (\Throwable $e) {
                Log::warning('Failed to broadcast AgentStatusUpdated event', ['error' => $e->getMessage()]);
            }
        }


        return $count;
    }
}
