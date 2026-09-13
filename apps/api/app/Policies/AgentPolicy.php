<?php

namespace App\Policies;

use App\Models\User;

class AgentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperadmin() || $user->isManager();
    }

    public function manage(User $user): bool
    {
        return $user->isSuperadmin() || $user->isManager();
    }

    public function updateStatus(User $user, User $agent): bool
    {
        return $user->isSuperadmin() || $user->id === $agent->id;
    }
}
