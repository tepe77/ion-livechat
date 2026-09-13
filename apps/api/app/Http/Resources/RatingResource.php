<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'agent_id' => $this->agent_id,
            'member_id' => $this->member_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'created_at' => $this->created_at->toISOString(),
            'agent' => $this->whenLoaded('agent', fn () => [
                'id' => $this->agent->id,
                'name' => $this->agent->name,
            ]),
        ];
    }
}
