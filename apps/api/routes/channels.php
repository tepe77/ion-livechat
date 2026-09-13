<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('conversation.{conversationId}', function (User $user, int $conversationId) {
    if ($user->isSuperadmin() || $user->isManager()) {
        return true;
    }

    $conversation = Conversation::find($conversationId);
    if (!$conversation) {
        return false;
    }

    return $conversation->member_id === $user->id || $conversation->agent_id === $user->id;
});

Broadcast::channel('agent.{agentId}', function (User $user, int $agentId) {
    if ($user->isSuperadmin()) {
        return true;
    }

    return (int) $user->id === (int) $agentId;
});

Broadcast::channel('manager.dashboard', function (User $user) {
    return $user->isManager() || $user->isSuperadmin();
});
