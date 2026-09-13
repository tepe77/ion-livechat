<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'customer_number',
        'role_id',
        'email_verified_at',
        'last_login_at',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function agentProfile(): HasOne
    {
        return $this->hasOne(AgentProfile::class);
    }

    public function agentStatus(): HasOne
    {
        return $this->hasOne(AgentStatus::class, 'agent_id');
    }

    public function memberConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'member_id');
    }

    public function agentConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'agent_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(ConversationRating::class, 'member_id');
    }

    public function hasRole(string|UserRole $role): bool
    {
        $roleSlug = $role instanceof UserRole ? $role->value : $role;
        return $this->role?->slug === $roleSlug;
    }

    public function isSuperadmin(): bool
    {
        return $this->hasRole(UserRole::SUPERADMIN);
    }

    public function isManager(): bool
    {
        return $this->hasRole(UserRole::MANAGER);
    }

    public function isAgent(): bool
    {
        return $this->hasRole(UserRole::AGENT);
    }

    public function isMember(): bool
    {
        return $this->hasRole(UserRole::MEMBER);
    }

    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->isSuperadmin()) {
            return true;
        }

        return $this->role?->permissions->contains('slug', $permissionSlug) ?? false;
    }
}
