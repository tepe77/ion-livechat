<?php

namespace App\Models;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\ConversationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'presence',
        'availability',
        'last_seen_at',
        'available_since',
    ];

    protected function casts(): array
    {
        return [
            'presence' => AgentPresence::class,
            'availability' => AgentAvailability::class,
            'last_seen_at' => 'datetime',
            'available_since' => 'datetime',
        ];
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function isOnline(): bool
    {
        return $this->presence === AgentPresence::ONLINE;
    }

    public function isAvailable(): bool
    {
        return $this->availability === AgentAvailability::AVAILABLE;
    }

    public function isEligibleForRouting(): bool
    {
        return $this->isOnline() && $this->isAvailable();
    }

    public function getActiveConversationsCountAttribute(): int
    {
        return Conversation::where('agent_id', $this->agent_id)
            ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
            ->count();
    }
}
