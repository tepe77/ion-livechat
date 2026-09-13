<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isMember = $user && $user->isMember();

        $data = [
            'id' => $this->id,
            'status' => $this->status->value,
            'started_at' => $this->started_at->toISOString(),
            'assigned_at' => $this->assigned_at?->toISOString(),
            'closed_at' => $this->closed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'agent' => $this->agent ? [
                'id' => $this->agent->id,
                'name' => $this->agent->name,
                'avatar' => $this->agent->avatar,
            ] : null,
            'latest_message' => $this->whenLoaded('latestMessage', function () {
                return $this->latestMessage ? (new MessageResource($this->latestMessage))->resolve() : null;
            }),
            'rating' => $this->whenLoaded('rating', function () {
                return $this->rating ? (new RatingResource($this->rating))->resolve() : null;
            }),
        ];

        // Staff-specific metadata
        if (!$isMember) {
            $data['member_id'] = $this->member_id;
            $data['member'] = $this->whenLoaded('member', function () {
                return [
                    'id' => $this->member->id,
                    'name' => $this->member->name,
                    'email' => $this->member->email,
                    'avatar' => $this->member->avatar,
                ];
            });
            $data['first_response_at'] = $this->first_response_at?->toISOString();
            $data['assignments'] = $this->whenLoaded('assignments', function () {
                return $this->assignments->map(fn ($assignment) => [
                    'id' => $assignment->id,
                    'agent_id' => $assignment->agent_id,
                    'assigned_at' => $assignment->assigned_at->toISOString(),
                    'unassigned_at' => $assignment->unassigned_at?->toISOString(),
                    'reason' => $assignment->reason->value,
                ]);
            });
        }

        return $data;
    }
}
