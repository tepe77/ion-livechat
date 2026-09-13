<?php

use App\Jobs\MarkStaleAgentsOffline;
use App\Jobs\ProcessWaitingConversations;
use App\Jobs\ReconcileAgentCapacity;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new MarkStaleAgentsOffline)->everyMinute();
Schedule::job(new ProcessWaitingConversations)->everyMinute();
Schedule::job(new ReconcileAgentCapacity)->everyMinute();
