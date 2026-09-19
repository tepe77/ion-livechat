<?php

use App\Jobs\MarkStaleAgentsOffline;
use App\Jobs\ProcessWaitingConversations;
use App\Jobs\ReconcileAgentCapacity;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new MarkStaleAgentsOffline)->everyMinute();
Schedule::job(new ProcessWaitingConversations)->everyMinute();
Schedule::job(new ReconcileAgentCapacity)->everyMinute();

// Automated Daily Storage & Log Pruning (runs off-peak at 02:00 WIB)
Schedule::command('ion:storage-prune')->dailyAt('02:00');

