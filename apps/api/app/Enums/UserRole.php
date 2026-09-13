<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPERADMIN = 'superadmin';
    case MANAGER = 'manager';
    case AGENT = 'agent';
    case MEMBER = 'member';
}
