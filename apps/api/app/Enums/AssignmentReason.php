<?php

namespace App\Enums;

enum AssignmentReason: string
{
    case AUTO_ROUTING = 'auto_routing';
    case MANUAL_ASSIGNMENT = 'manual_assignment';
    case TRANSFER = 'transfer';
}
