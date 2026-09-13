<?php

namespace App\Models;

use App\Enums\ConversationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'agent_id',
        'status',
        'started_at',
        'assigned_at',
        'first_response_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ConversationStatus::class,
            'started_at' => 'datetime',
            'assigned_at' => 'datetime',
            'first_response_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ConversationAssignment::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function rating(): HasOne
    {
        return $this->hasOne(ConversationRating::class);
    }

    public function isWaiting(): bool
    {
        return $this->status === ConversationStatus::WAITING;
    }

    public function isAssigned(): bool
    {
        return $this->status === ConversationStatus::ASSIGNED;
    }

    public function isActive(): bool
    {
        return $this->status === ConversationStatus::ACTIVE;
    }

    public function isClosed(): bool
    {
        return $this->status === ConversationStatus::CLOSED;
    }

    public function canReceiveMessage(): bool
    {
        return $this->status !== ConversationStatus::CLOSED;
    }

    public function canBeRated(): bool
    {
        return $this->status === ConversationStatus::CLOSED && !$this->rating()->exists();
    }
}
