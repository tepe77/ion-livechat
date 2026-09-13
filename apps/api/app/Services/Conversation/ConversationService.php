<?php

namespace App\Services\Conversation;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\AssignmentReason;
use App\Enums\ConversationStatus;
use App\Events\ConversationClosed;
use App\Events\ConversationCreated;
use App\Events\ConversationTransferred;
use App\Models\AgentProfile;
use App\Models\AgentStatus;
use App\Models\Conversation;
use App\Models\ConversationAssignment;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Routing\RoutingService;
use App\Services\Routing\WaitingQueueService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;


class ConversationService
{
    public function __construct(
        protected RoutingService $routingService,
        protected WaitingQueueService $waitingQueueService,
        protected AuditService $auditService
    ) {}

    /**
     * Create a new conversation for a member and attempt automatic smart routing.
     */
    public function createConversation(User $member): Conversation
    {
        $conversation = DB::transaction(function () use ($member) {
            $conv = Conversation::create([
                'member_id' => $member->id,
                'status' => ConversationStatus::WAITING,
                'started_at' => now(),
            ]);

            $this->auditService->log(
                $member,
                'conversation.created',
                'Conversation',
                $conv->id
            );

            return $conv;
        });

        // Broadcast conversation created event
        try {
            event(new ConversationCreated($conversation));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast ConversationCreated event', ['error' => $e->getMessage()]);
        }


        // Attempt assignment via smart routing
        $this->routingService->assignConversation($conversation);

        return $conversation->fresh(['member', 'agent', 'latestMessage']);
    }

    /**
     * Transfer conversation to another eligible agent.
     */
    public function transferConversation(Conversation $conversation, User $actor, int $targetAgentId): Conversation
    {
        if ($conversation->isClosed()) {
            throw new ConflictHttpException('Cannot transfer a closed conversation.');
        }

        if ($conversation->agent_id === $targetAgentId) {
            throw new UnprocessableEntityHttpException('Cannot transfer to the currently assigned agent.');
        }

        $targetAgent = User::where('id', $targetAgentId)->where('is_active', true)->first();
        if (!$targetAgent || !$targetAgent->isAgent()) {
            throw new UnprocessableEntityHttpException('Target agent is invalid or inactive.');
        }

        return DB::transaction(function () use ($conversation, $actor, $targetAgent) {
            // Lock target agent profile and check capacity
            $profile = AgentProfile::where('user_id', $targetAgent->id)->lockForUpdate()->firstOrFail();
            $status = AgentStatus::where('agent_id', $targetAgent->id)->lockForUpdate()->firstOrFail();

            if ($status->presence !== AgentPresence::ONLINE || $status->availability !== AgentAvailability::AVAILABLE) {
                throw new UnprocessableEntityHttpException('Target agent is currently offline or unavailable.');
            }

            $activeCount = Conversation::where('agent_id', $targetAgent->id)
                ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
                ->count();

            if ($activeCount >= $profile->max_concurrent_conversations) {
                throw new UnprocessableEntityHttpException('Target agent has reached maximum concurrent conversation capacity.');
            }

            $now = now();

            // Close existing assignment
            ConversationAssignment::where('conversation_id', $conversation->id)
                ->whereNull('unassigned_at')
                ->update(['unassigned_at' => $now]);

            // Create new assignment
            ConversationAssignment::create([
                'conversation_id' => $conversation->id,
                'agent_id' => $targetAgent->id,
                'assigned_at' => $now,
                'reason' => AssignmentReason::TRANSFER,
            ]);

            // Update conversation agent
            $conversation->update([
                'agent_id' => $targetAgent->id,
            ]);

            $this->auditService->log(
                $actor,
                'conversation.transferred',
                'Conversation',
                $conversation->id,
                ['target_agent_id' => $targetAgent->id]
            );

            // Broadcast transfer event
            try {
                event(new ConversationTransferred($conversation, $targetAgent));
            } catch (\Throwable $e) {
                Log::warning('Failed to broadcast ConversationTransferred event', ['error' => $e->getMessage()]);
            }

            // Check if former agent now has freed capacity to process waiting queue
            $this->waitingQueueService->processWaitingConversations();

            return $conversation->fresh(['member', 'agent']);
        });
    }

    /**
     * Close an active or assigned conversation.
     */
    public function closeConversation(Conversation $conversation, User $actor): Conversation
    {
        if ($conversation->isClosed()) {
            throw new ConflictHttpException('Conversation is already closed.');
        }

        $closedConversation = DB::transaction(function () use ($conversation, $actor) {
            $now = now();

            // Close active assignment
            ConversationAssignment::where('conversation_id', $conversation->id)
                ->whereNull('unassigned_at')
                ->update(['unassigned_at' => $now]);

            $conversation->update([
                'status' => ConversationStatus::CLOSED,
                'closed_at' => $now,
            ]);

            $this->auditService->log(
                $actor,
                'conversation.closed',
                'Conversation',
                $conversation->id,
                [
                    'resolution_time_seconds' => $conversation->started_at
                        ? $now->diffInSeconds($conversation->started_at)
                        : null,
                ]
            );

            return $conversation;
        });

        // Broadcast closed event
        try {
            event(new ConversationClosed($closedConversation));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast ConversationClosed event', ['error' => $e->getMessage()]);
        }


        // Agent now has freed capacity: process waiting queue immediately!
        $this->waitingQueueService->processWaitingConversations();

        return $closedConversation->fresh(['member', 'agent', 'rating']);
    }

    /**
     * Delete a conversation and clean up assignments and waiting queue.
     */
    public function deleteConversation(Conversation $conversation, User $actor): void
    {
        DB::transaction(function () use ($conversation, $actor) {
            $conversationId = $conversation->id;

            // If conversation was active or assigned, close active assignment
            if (!$conversation->isClosed()) {
                ConversationAssignment::where('conversation_id', $conversationId)
                    ->whereNull('unassigned_at')
                    ->update(['unassigned_at' => now()]);
            }

            $conversation->delete();

            $this->auditService->log(
                $actor,
                'conversation.deleted',
                'Conversation',
                $conversationId
            );
        });

        // Trigger queue process in case agent capacity was freed
        $this->waitingQueueService->processWaitingConversations();
    }
}
