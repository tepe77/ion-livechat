<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Message $message
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];

        $agentId = $this->message->relationLoaded('conversation')
            ? $this->message->conversation?->agent_id
            : $this->message->conversation()->value('agent_id');

        if ($agentId) {
            $channels[] = new PrivateChannel('agent.' . $agentId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message.created';
    }

    public function broadcastWith(): array
    {
        $this->message->loadMissing(['sender', 'attachments', 'conversation']);

        return [
            'message' => [
                'id' => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'sender_id' => $this->message->sender_id,
                'type' => $this->message->type->value,
                'content' => $this->message->content,
                'created_at' => $this->message->created_at->toISOString(),
                'read_at' => $this->message->read_at?->toISOString(),
                'sender' => [
                    'id' => $this->message->sender->id,
                    'name' => $this->message->sender->name,
                    'avatar' => $this->message->sender->avatar,
                    'role' => $this->message->sender->role?->slug,
                ],
                'attachments' => $this->message->attachments->map(fn ($att) => [
                    'id' => $att->id,
                    'original_name' => $att->original_name,
                    'mime_type' => $att->mime_type,
                    'size' => $att->size,
                    'url' => $att->url,
                ])->toArray(),
            ],
            'conversation' => [
                'id' => $this->message->conversation_id,
                'status' => $this->message->conversation?->status?->value,
                'first_response_at' => $this->message->conversation?->first_response_at?->toISOString(),
            ],
        ];
    }
}

