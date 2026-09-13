<?php

namespace App\Http\Controllers;

use App\Enums\AgentAvailability;
use App\Http\Requests\Agent\UpdateAgentStatusRequest;
use App\Http\Resources\AgentStatusResource;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Services\Agent\AgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function __construct(
        protected AgentService $agentService
    ) {}

    public function conversations(Request $request): JsonResponse
    {
        $agent = $request->user();

        $query = Conversation::where('agent_id', $agent->id)
            ->with(['member', 'latestMessage'])
            ->orderBy('updated_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            $query->whereIn('status', ['assigned', 'active']);
        }

        $conversations = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'data' => ConversationResource::collection($conversations)->resolve(),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
            ],
        ]);
    }

    public function getStatus(Request $request): JsonResponse
    {
        $status = $this->agentService->getAgentStatus($request->user());

        return response()->json([
            'data' => (new AgentStatusResource($status))->resolve(),
        ]);
    }

    public function updateStatus(UpdateAgentStatusRequest $request): JsonResponse
    {
        $status = $this->agentService->updateAvailability(
            $request->user(),
            AgentAvailability::from($request->availability)
        );

        return response()->json([
            'data' => (new AgentStatusResource($status))->resolve(),
            'message' => 'Agent availability updated.',
        ]);
    }

    public function heartbeat(Request $request): JsonResponse
    {
        $status = $this->agentService->recordHeartbeat($request->user());

        return response()->json([
            'data' => (new AgentStatusResource($status))->resolve(),
            'message' => 'Heartbeat recorded.',
        ]);
    }
}
