<?php

namespace App\Enums;

enum ConversationStatus: string
{
    case WAITING = 'waiting';
    case ASSIGNED = 'assigned';
    case ACTIVE = 'active';
    case CLOSED = 'closed';
}
