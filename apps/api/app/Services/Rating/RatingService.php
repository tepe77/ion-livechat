<?php

namespace App\Services\Rating;

use App\Models\Conversation;
use App\Models\ConversationRating;
use App\Models\User;
use App\Services\Audit\AuditService;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\ForbiddenHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class RatingService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Submit a rating for a closed conversation.
     */
    public function submitRating(Conversation $conversation, User $member, int $rating, ?string $comment = null): ConversationRating
    {
        if (!$conversation->isClosed()) {
            throw new ConflictHttpException('Cannot rate an ongoing conversation. The conversation must be closed first.');
        }

        if ($conversation->member_id !== $member->id) {
            throw new ForbiddenHttpException('You can only rate your own conversation.');
        }

        if ($rating < 1 || $rating > 5) {
            throw new UnprocessableEntityHttpException('Rating must be an integer between 1 and 5.');
        }

        if ($conversation->rating()->exists()) {
            throw new ConflictHttpException('This conversation has already been rated.');
        }

        if (!$conversation->agent_id) {
            throw new UnprocessableEntityHttpException('Cannot rate a conversation without an assigned agent.');
        }

        $createdRating = ConversationRating::create([
            'conversation_id' => $conversation->id,
            'agent_id' => $conversation->agent_id,
            'member_id' => $member->id,
            'rating' => $rating,
            'comment' => $comment,
        ]);

        $this->auditService->log(
            $member,
            'rating.created',
            'ConversationRating',
            $createdRating->id,
            [
                'conversation_id' => $conversation->id,
                'agent_id' => $conversation->agent_id,
                'rating' => $rating,
            ]
        );

        return $createdRating;
    }
}
