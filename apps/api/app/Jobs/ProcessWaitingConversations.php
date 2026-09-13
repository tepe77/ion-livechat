<?php

namespace App\Jobs;

use App\Services\Routing\WaitingQueueService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessWaitingConversations implements ShouldQueue
{
    use Queueable;

    public function handle(WaitingQueueService $waitingQueueService): void
    {
        $assigned = $waitingQueueService->processWaitingConversations();
        if ($assigned > 0) {
            Log::info("Assigned {$assigned} waiting conversations.");
        }
    }
}
