<?php

namespace App\Http\Controllers;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\UserRole;
use App\Http\Requests\Agent\CreateAgentRequest;
use App\Http\Requests\Agent\UpdateAgentRequest;
use App\Http\Resources\AgentResource;
use App\Http\Resources\ConversationResource;
use App\Models\AgentProfile;
use App\Models\AgentStatus;
use App\Models\Conversation;
use App\Models\Role;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Metrics\MetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ManagerController extends Controller
{
    public function __construct(
        protected MetricsService $metricsService,
        protected AuditService $auditService
    ) {}

    public function dashboard(): JsonResponse
    {
        $stats = $this->metricsService->getDashboardStats();

        return response()->json([
            'data' => $stats,
        ]);
    }

    public function agents(Request $request): JsonResponse
    {
        $agentRole = Role::where('slug', UserRole::AGENT->value)->firstOrFail();

        $query = User::where('role_id', $agentRole->id)
            ->with(['agentStatus', 'agentProfile']);

        if ($request->has('presence')) {
            $query->whereHas('agentStatus', fn ($q) => $q->where('presence', $request->presence));
        }

        if ($request->has('availability')) {
            $query->whereHas('agentStatus', fn ($q) => $q->where('availability', $request->availability));
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $agents = $query->paginate($perPage);

        return response()->json([
            'data' => AgentResource::collection($agents)->resolve(),
            'meta' => [
                'current_page' => $agents->currentPage(),
                'per_page' => $agents->perPage(),
                'total' => $agents->total(),
                'last_page' => $agents->lastPage(),
            ],
        ]);
    }

    public function agentDetail(int $agentId): JsonResponse
    {
        $agent = User::with(['agentStatus', 'agentProfile'])->findOrFail($agentId);

        return response()->json([
            'data' => (new AgentResource($agent))->resolve(),
        ]);
    }

    public function createAgent(CreateAgentRequest $request): JsonResponse
    {
        $agentRole = Role::where('slug', UserRole::AGENT->value)->firstOrFail();

        $agent = DB::transaction(function () use ($request, $agentRole) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $agentRole->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            AgentProfile::create([
                'user_id' => $user->id,
                'max_concurrent_conversations' => $request->input('max_concurrent_conversations', 5),
            ]);

            AgentStatus::create([
                'agent_id' => $user->id,
                'presence' => AgentPresence::OFFLINE,
                'availability' => AgentAvailability::AVAILABLE,
            ]);

            $this->auditService->log(
                $request->user(),
                'agent.created',
                'User',
                $user->id,
                ['name' => $user->name, 'email' => $user->email]
            );

            return $user;
        });

        return response()->json([
            'data' => (new AgentResource($agent->load(['agentStatus', 'agentProfile'])))->resolve(),
            'message' => 'Agent created successfully.',
        ], 201);
    }

    public function updateAgent(UpdateAgentRequest $request, int $agentId): JsonResponse
    {
        $agent = User::with(['agentProfile', 'agentStatus'])->findOrFail($agentId);

        DB::transaction(function () use ($request, $agent) {
            $userUpdates = $request->only(['name', 'email', 'is_active']);
            if ($request->filled('password')) {
                $userUpdates['password'] = Hash::make($request->password);
            }
            if (!empty($userUpdates)) {
                $agent->update($userUpdates);
            }

            if ($request->has('max_concurrent_conversations')) {
                $agent->agentProfile()->updateOrCreate(
                    ['user_id' => $agent->id],
                    ['max_concurrent_conversations' => $request->max_concurrent_conversations]
                );
            }

            $this->auditService->log(
                $request->user(),
                'agent.updated',
                'User',
                $agent->id,
                $request->except('password')
            );
        });

        return response()->json([
            'data' => (new AgentResource($agent->fresh(['agentStatus', 'agentProfile'])))->resolve(),
            'message' => 'Agent updated successfully.',
        ]);
    }

    public function agentPerformance(int $agentId): JsonResponse
    {
        $performance = $this->metricsService->getAgentPerformance($agentId);

        return response()->json([
            'data' => $performance,
        ]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $query = Conversation::with(['member', 'agent', 'latestMessage', 'rating'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('agent_id')) {
            $query->where('agent_id', $request->agent_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $conversations = $query->paginate($perPage);

        return response()->json([
            'data' => ConversationResource::collection($conversations)->resolve(),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
                'last_page' => $conversations->lastPage(),
            ],
        ]);
    }
}
