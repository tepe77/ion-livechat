<?php

namespace App\Services\Metrics;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\AssignmentReason;
use App\Enums\ConversationStatus;
use App\Models\AgentStatus;
use App\Models\Conversation;
use App\Models\ConversationAssignment;
use App\Models\ConversationRating;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MetricsService
{
    /**
     * Compute real-time operational dashboard metrics for Managers/Superadmins.
     */
    public function getDashboardStats(): array
    {
        $waiting = Conversation::where('status', ConversationStatus::WAITING)->count();
        $active = Conversation::whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])->count();
        $closedToday = Conversation::where('status', ConversationStatus::CLOSED)
            ->whereDate('closed_at', today())
            ->count();

        $onlineAgents = AgentStatus::where('presence', AgentPresence::ONLINE)->count();
        $availableAgents = AgentStatus::where('presence', AgentPresence::ONLINE)
            ->where('availability', AgentAvailability::AVAILABLE)
            ->count();

        $driver = DB::connection()->getDriverName();

        // Calculate Average First Response Time (in seconds)
        $avgFirstResponse = null;
        try {
            $frSql = match ($driver) {
                'pgsql' => 'AVG(EXTRACT(EPOCH FROM (first_response_at - assigned_at))) as avg_seconds',
                'sqlite' => 'AVG(strftime(\'%s\', first_response_at) - strftime(\'%s\', assigned_at)) as avg_seconds',
                'mysql', 'mariadb' => 'AVG(TIMESTAMPDIFF(SECOND, assigned_at, first_response_at)) as avg_seconds',
                default => null,
            };

            if ($frSql) {
                $avgFirstResponse = DB::table('conversations')
                    ->whereNotNull('assigned_at')
                    ->whereNotNull('first_response_at')
                    ->selectRaw($frSql)
                    ->value('avg_seconds');
            }
        } catch (\Throwable) {
            $avgFirstResponse = null;
        }

        // Fallback for generic db or if raw query failed
        if (is_null($avgFirstResponse)) {
            $firstResponses = Conversation::whereNotNull('assigned_at')
                ->whereNotNull('first_response_at')
                ->get()
                ->map(fn ($c) => $c->first_response_at->diffInSeconds($c->assigned_at));
            $avgFirstResponse = $firstResponses->isEmpty() ? 0 : round($firstResponses->avg());
        }

        // Calculate Average Resolution Time (in seconds)
        $avgResolution = null;
        try {
            $resSql = match ($driver) {
                'pgsql' => 'AVG(EXTRACT(EPOCH FROM (closed_at - started_at))) as avg_seconds',
                'sqlite' => 'AVG(strftime(\'%s\', closed_at) - strftime(\'%s\', started_at)) as avg_seconds',
                'mysql', 'mariadb' => 'AVG(TIMESTAMPDIFF(SECOND, started_at, closed_at)) as avg_seconds',
                default => null,
            };

            if ($resSql) {
                $avgResolution = DB::table('conversations')
                    ->where('status', ConversationStatus::CLOSED->value)
                    ->whereNotNull('started_at')
                    ->whereNotNull('closed_at')
                    ->selectRaw($resSql)
                    ->value('avg_seconds');
            }
        } catch (\Throwable) {
            $avgResolution = null;
        }

        if (is_null($avgResolution)) {
            $resolutions = Conversation::where('status', ConversationStatus::CLOSED)
                ->whereNotNull('started_at')
                ->whereNotNull('closed_at')
                ->get()
                ->map(fn ($c) => $c->closed_at->diffInSeconds($c->started_at));
            $avgResolution = $resolutions->isEmpty() ? 0 : round($resolutions->avg());
        }

        // Average Customer Rating
        $avgRating = ConversationRating::avg('rating') ?? 0.0;

        return [
            'waiting' => $waiting,
            'active' => $active,
            'closed_today' => $closedToday,
            'online_agents' => $onlineAgents,
            'available_agents' => $availableAgents,
            'average_first_response_time' => (int) round($avgFirstResponse),
            'average_resolution_time' => (int) round($avgResolution),
            'average_rating' => (float) round($avgRating, 1),
        ];
    }

    /**
     * Compute individual performance metrics for a specific agent.
     */
    public function getAgentPerformance(int $agentId): array
    {
        $agent = User::findOrFail($agentId);

        $totalConversations = Conversation::where('agent_id', $agentId)->count();
        $activeConversations = Conversation::where('agent_id', $agentId)
            ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
            ->count();
        $closedConversations = Conversation::where('agent_id', $agentId)
            ->where('status', ConversationStatus::CLOSED)
            ->count();
        $transferredConversations = ConversationAssignment::where('agent_id', $agentId)
            ->where('reason', AssignmentReason::TRANSFER)
            ->count();

        // First response time
        $agentConvsWithFR = Conversation::where('agent_id', $agentId)
            ->whereNotNull('assigned_at')
            ->whereNotNull('first_response_at')
            ->get();
        $avgFirstResponse = $agentConvsWithFR->isEmpty()
            ? 0
            : round($agentConvsWithFR->map(fn ($c) => $c->first_response_at->diffInSeconds($c->assigned_at))->avg());

        // Resolution time
        $closedConvs = Conversation::where('agent_id', $agentId)
            ->where('status', ConversationStatus::CLOSED)
            ->whereNotNull('started_at')
            ->whereNotNull('closed_at')
            ->get();
        $avgResolution = $closedConvs->isEmpty()
            ? 0
            : round($closedConvs->map(fn ($c) => $c->closed_at->diffInSeconds($c->started_at))->avg());

        // Ratings & Distribution
        $ratings = ConversationRating::where('agent_id', $agentId)->get();
        $avgRating = $ratings->isEmpty() ? 0.0 : round($ratings->avg('rating'), 1);

        $distribution = [
            1 => $ratings->where('rating', 1)->count(),
            2 => $ratings->where('rating', 2)->count(),
            3 => $ratings->where('rating', 3)->count(),
            4 => $ratings->where('rating', 4)->count(),
            5 => $ratings->where('rating', 5)->count(),
        ];

        return [
            'agent_id' => $agent->id,
            'agent_name' => $agent->name,
            'total_conversations' => $totalConversations,
            'active_conversations' => $activeConversations,
            'closed_conversations' => $closedConversations,
            'transferred_conversations' => $transferredConversations,
            'first_response_time' => (int) $avgFirstResponse,
            'average_response_time' => (int) $avgFirstResponse, // MVP proxy
            'average_resolution_time' => (int) $avgResolution,
            'average_rating' => (float) $avgRating,
            'rating_distribution' => $distribution,
        ];
    }
}
