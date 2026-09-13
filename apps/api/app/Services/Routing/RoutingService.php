<?php

namespace App\Services\Routing;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\AssignmentReason;
use App\Enums\ConversationStatus;
use App\Events\ConversationAssigned;
use App\Models\AgentProfile;
use App\Models\AgentStatus;
use App\Models\Conversation;
use App\Models\ConversationAssignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RoutingService
{

    /**
     * Atomically find and assign the most eligible agent to a conversation.
     * Concurrency-safe using PostgreSQL transaction and row-level locking.
     */
    public function assignConversation(Conversation $conversation): ?User
    {
        return DB::transaction(function () use ($conversation) {
            // Lock the conversation row to avoid concurrent assignment of the same conversation
            $lockedConversation = Conversation::where('id', $conversation->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedConversation->isClosed()) {
                return null;
            }

            // Find eligible candidate agents:
            // 1. User active = true
            // 2. Presence = online
            // 3. Availability = available
            // 4. Heartbeat active within 90 seconds (if last_seen_at is recorded)
            $candidateProfiles = AgentProfile::query()
                ->join('users', 'users.id', '=', 'agent_profiles.user_id')
                ->join('agent_statuses', 'agent_statuses.agent_id', '=', 'agent_profiles.user_id')
                ->where('users.is_active', true)
                ->where('agent_statuses.presence', AgentPresence::ONLINE->value)
                ->where('agent_statuses.availability', AgentAvailability::AVAILABLE->value)
                ->where(function ($query) {
                    $query->whereNull('agent_statuses.last_seen_at')
                        ->orWhere('agent_statuses.last_seen_at', '>=', now()->subSeconds(90));
                })
                ->select([
                    'agent_profiles.id as profile_id',
                    'agent_profiles.user_id',
                    'agent_profiles.max_concurrent_conversations',
                    'agent_statuses.available_since',
                ])
                ->lockForUpdate()
                ->get();

            if ($candidateProfiles->isEmpty()) {
                if ($lockedConversation->status !== ConversationStatus::WAITING) {
                    $lockedConversation->update(['status' => ConversationStatus::WAITING]);
                }
                return null;
            }

            // Calculate active workloads for each candidate under lock
            $candidateUserIds = $candidateProfiles->pluck('user_id')->toArray();

            $activeCounts = Conversation::query()
                ->whereIn('agent_id', $candidateUserIds)
                ->whereIn('status', [ConversationStatus::ASSIGNED->value, ConversationStatus::ACTIVE->value])
                ->selectRaw('agent_id, count(*) as active_count')
                ->groupBy('agent_id')
                ->pluck('active_count', 'agent_id')
                ->toArray();

            // Filter candidates who have remaining capacity
            $eligibleCandidates = $candidateProfiles->filter(function ($candidate) use ($activeCounts) {
                $currentWorkload = $activeCounts[$candidate->user_id] ?? 0;
                return $currentWorkload < $candidate->max_concurrent_conversations;
            });

            if ($eligibleCandidates->isEmpty()) {
                if ($lockedConversation->status !== ConversationStatus::WAITING) {
                    $lockedConversation->update(['status' => ConversationStatus::WAITING]);
                }
                return null;
            }

            // Sort by:
            // 1. Lowest active workload
            // 2. Longest availability (earliest available_since timestamp)
            // 3. Deterministic tie-breaker (user_id ASC)
            $bestCandidate = $eligibleCandidates->sort(function ($a, $b) use ($activeCounts) {
                $workloadA = $activeCounts[$a->user_id] ?? 0;
                $workloadB = $activeCounts[$b->user_id] ?? 0;

                if ($workloadA !== $workloadB) {
                    return $workloadA <=> $workloadB;
                }

                $sinceA = $a->available_since ? strtotime($a->available_since) : 0;
                $sinceB = $b->available_since ? strtotime($b->available_since) : 0;

                if ($sinceA !== $sinceB) {
                    return $sinceA <=> $sinceB;
                }

                return $a->user_id <=> $b->user_id;
            })->first();

            $assignedAgent = User::find($bestCandidate->user_id);

            // Atomic assignment
            $now = now();
            $lockedConversation->update([
                'agent_id' => $assignedAgent->id,
                'status' => ConversationStatus::ASSIGNED,
                'assigned_at' => $now,
            ]);

            ConversationAssignment::create([
                'conversation_id' => $lockedConversation->id,
                'agent_id' => $assignedAgent->id,
                'assigned_at' => $now,
                'reason' => AssignmentReason::AUTO_ROUTING,
            ]);

            // Fire assignment event
            try {
                event(new ConversationAssigned($lockedConversation, $assignedAgent));
            } catch (\Throwable $e) {
                Log::warning('Failed to broadcast ConversationAssigned event', ['error' => $e->getMessage()]);
            }

            return $assignedAgent;

        });
    }
}
