<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Request;

class AuditService
{
    public function log(
        User|int|null $actor,
        string $action,
        ?string $targetType = null,
        ?int $targetId = null,
        ?array $metadata = null
    ): AuditLog {
        $actorId = $actor instanceof User ? $actor->id : $actor;

        return AuditLog::create([
            'actor_id' => $actorId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'metadata' => $metadata,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'created_at' => now(),
        ]);
    }
}
