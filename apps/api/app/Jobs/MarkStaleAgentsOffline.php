<?php

namespace App\Jobs;

use App\Services\Agent\AgentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class MarkStaleAgentsOffline implements ShouldQueue
{
    use Queueable;

    public function handle(AgentService $agentService): void
    {
        $markedCount = $agentService->markStaleAgentsOffline(60);
        if ($markedCount > 0) {
            Log::info("Marked {$markedCount} stale agents offline.");
        }
    }
}
