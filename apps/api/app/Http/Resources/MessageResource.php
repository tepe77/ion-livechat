<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id' => $this->sender_id,
            'type' => $this->type->value,
            'content' => $this->content,
            'created_at' => $this->created_at->toISOString(),
            'read_at' => $this->read_at?->toISOString(),
            'sender' => $this->whenLoaded('sender', function () {
                return [
                    'id' => $this->sender->id,
                    'name' => $this->sender->name,
                    'avatar' => $this->sender->avatar,
                    'role' => $this->sender->role?->slug,
                ];
            }),
            'attachments' => $this->whenLoaded('attachments', function () {
                return $this->attachments->map(fn ($att) => [
                    'id' => $att->id,
                    'original_name' => $att->original_name,
                    'mime_type' => $att->mime_type,
                    'size' => $att->size,
                    'url' => $att->url,
                ]);
            }),
        ];
    }
}
