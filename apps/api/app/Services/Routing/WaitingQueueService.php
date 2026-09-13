<?php

namespace App\Services\Routing;

use App\Enums\ConversationStatus;
use App\Models\Conversation;
use Illuminate\Support\Facades\Log;

class WaitingQueueService
{
    public function __construct(
        protected RoutingService $routingService
    ) {}

    /**
     * Process WAITING conversations in strict FIFO order (created_at ASC, id ASC).
     * Returns the count of successfully assigned conversations.
     */
    public function processWaitingConversations(): int
    {
        $waitingConversations = Conversation::query()
            ->where('status', ConversationStatus::WAITING)
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $assignedCount = 0;

        foreach ($waitingConversations as $conversation) {
            try {
                $assignedAgent = $this->routingService->assignConversation($conversation);
                if ($assignedAgent) {
                    $assignedCount++;
                } else {
                    // No agent available currently, stop early or continue check
                    break;
                }
            } catch (\Throwable $e) {
                Log::error("Failed to assign waiting conversation {$conversation->id}: " . $e->getMessage());
            }
        }

        return $assignedCount;
    }
}
