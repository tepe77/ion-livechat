<?php

namespace App\Services\Message;

use App\Enums\ConversationStatus;
use App\Enums\MessageType;
use App\Events\MessageCreated;
use App\Events\MessageRead;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

use Symfony\Component\HttpKernel\Exception\ForbiddenHttpException;

class MessageService
{
    /**
     * Send a message within a conversation.
     */
    public function sendMessage(
        Conversation $conversation,
        User $sender,
        MessageType $type,
        string $content,
        array $attachments = []
    ): Message {
        if ($conversation->isClosed()) {
            throw new ConflictHttpException('Cannot send a message to a closed conversation.');
        }

        // Validate membership
        $isMember = $conversation->member_id === $sender->id;
        $isAssignedAgent = $conversation->agent_id === $sender->id;
        $isPrivilegedStaff = $sender->isManager() || $sender->isSuperadmin();

        if (!$isMember && !$isAssignedAgent && !$isPrivilegedStaff) {
            throw new ForbiddenHttpException('You are not authorized to send messages in this conversation.');
        }

        return DB::transaction(function () use ($conversation, $sender, $type, $content, $attachments, $isAssignedAgent, $isPrivilegedStaff) {
            $now = now();

            // Update lifecycle: ASSIGNED -> ACTIVE on first agent message
            if (($isAssignedAgent || $isPrivilegedStaff) && $conversation->status === ConversationStatus::ASSIGNED) {
                $conversation->update(['status' => ConversationStatus::ACTIVE]);
            }

            // Record first response timestamp if agent is replying for the first time
            if (($isAssignedAgent || $isPrivilegedStaff) && is_null($conversation->first_response_at)) {
                $conversation->update(['first_response_at' => $now]);
            }

            // Create message
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                'type' => $type,
                'content' => $content,
                'created_at' => $now,
            ]);

            // Save attachments
            foreach ($attachments as $attachmentData) {
                MessageAttachment::create([
                    'message_id' => $message->id,
                    'disk' => $attachmentData['disk'] ?? 'local',
                    'path' => $attachmentData['path'],
                    'original_name' => $attachmentData['original_name'],
                    'mime_type' => $attachmentData['mime_type'],
                    'size' => $attachmentData['size'],
                ]);
            }

            // Touch conversation timestamp
            $conversation->touch();

            // Broadcast message created event
            try {
                event(new MessageCreated($message));
            } catch (\Throwable $e) {
                Log::warning('Failed to broadcast MessageCreated event', ['error' => $e->getMessage()]);
            }

            return $message->fresh(['sender', 'attachments']);
        });
    }

    /**
     * Mark a message as read.
     */
    public function markAsRead(Conversation $conversation, User $reader, int $messageId): Message
    {
        $message = Message::where('conversation_id', $conversation->id)
            ->where('id', $messageId)
            ->firstOrFail();

        // Only mark as read if reader is not the message author
        if ($message->sender_id !== $reader->id && is_null($message->read_at)) {
            $now = now();
            $message->update(['read_at' => $now]);

            try {
                event(new MessageRead(
                    $conversation->id,
                    $message->id,
                    $reader->id,
                    $now->toISOString()
                ));
            } catch (\Throwable $e) {
                Log::warning('Failed to broadcast MessageRead event', ['error' => $e->getMessage()]);
            }
        }

        return $message;
    }


    /**
     * Store an attachment file and return metadata.
     */
    public function storeAttachment(Conversation $conversation, User $uploader, UploadedFile $file): array
    {
        $path = $file->store('attachments/' . $conversation->id, 'public');

        return [
            'disk' => 'public',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: ($file->getClientMimeType() ?: 'application/octet-stream'),
            'size' => $file->getSize(),
        ];
    }
}
