<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    public function view(User $user, Conversation $conversation): bool
    {
        if ($user->isSuperadmin() || $user->isManager()) {
            return true;
        }

        if ($user->isMember()) {
            return $conversation->member_id === $user->id;
        }

        if ($user->isAgent()) {
            return $conversation->agent_id === $user->id;
        }

        return false;
    }

    public function sendMessage(User $user, Conversation $conversation): bool
    {
        if ($user->isSuperadmin() || $user->isManager()) {
            return true;
        }

        if ($user->isMember()) {
            return $conversation->member_id === $user->id;
        }

        if ($user->isAgent()) {
            return $conversation->agent_id === $user->id;
        }

        return false;
    }

    public function close(User $user, Conversation $conversation): bool
    {
        if ($conversation->isClosed()) {
            return false;
        }

        if ($user->isSuperadmin() || $user->isManager()) {
            return true;
        }

        if ($user->isMember()) {
            return $conversation->member_id === $user->id;
        }

        return $user->isAgent() && $conversation->agent_id === $user->id;
    }

    public function transfer(User $user, Conversation $conversation): bool
    {
        if ($conversation->isClosed()) {
            return false;
        }

        if ($user->isSuperadmin() || $user->isManager()) {
            return true;
        }

        return $user->isAgent() && $conversation->agent_id === $user->id;
    }

    public function rate(User $user, Conversation $conversation): bool
    {
        return $user->isMember() && $conversation->member_id === $user->id && $conversation->isClosed();
    }

    public function delete(User $user, Conversation $conversation): bool
    {
        if ($user->isSuperadmin()) {
            return true;
        }

        if ($user->isMember()) {
            return $conversation->member_id === $user->id;
        }

        return false;
    }
}
