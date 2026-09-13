<?php

namespace App\Enums;

enum AgentAvailability: string
{
    case AVAILABLE = 'available';
    case AWAY = 'away';
    case BUSY = 'busy';
}
