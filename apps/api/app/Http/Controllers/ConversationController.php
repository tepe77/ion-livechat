<?php

namespace App\Http\Controllers;

use App\Http\Requests\Conversation\TransferConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Services\Conversation\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ConversationController extends Controller
{
    public function __construct(
        protected ConversationService $conversationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Conversation::query()
            ->where('member_id', $user->id)
            ->with(['agent', 'latestMessage', 'rating'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = min((int) $request->input('per_page', 20), 50);
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

    public function show(Request $request, int $id): JsonResponse
    {
        $conversation = Conversation::with(['member', 'agent', 'latestMessage', 'rating', 'assignments.agent'])
            ->findOrFail($id);

        Gate::authorize('view', $conversation);

        return response()->json([
            'data' => (new ConversationResource($conversation))->resolve(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if member already has an active or waiting conversation
        $existing = Conversation::where('member_id', $user->id)
            ->whereIn('status', ['waiting', 'assigned', 'active'])
            ->first();

        if ($existing) {
            return response()->json([
                'data' => (new ConversationResource($existing->loadMissing(['agent', 'latestMessage'])))->resolve(),
                'message' => 'Returning active conversation.',
            ]);
        }

        $conversation = $this->conversationService->createConversation($user);

        return response()->json([
            'data' => (new ConversationResource($conversation))->resolve(),
            'message' => 'Conversation started.',
        ], 201);
    }

    public function close(Request $request, int $id): JsonResponse
    {
        $conversation = Conversation::findOrFail($id);
        Gate::authorize('close', $conversation);

        $closed = $this->conversationService->closeConversation($conversation, $request->user());

        return response()->json([
            'data' => (new ConversationResource($closed))->resolve(),
            'message' => 'Conversation closed.',
        ]);
    }

    public function transfer(TransferConversationRequest $request, int $id): JsonResponse
    {
        $conversation = Conversation::findOrFail($id);
        Gate::authorize('transfer', $conversation);

        $transferred = $this->conversationService->transferConversation(
            $conversation,
            $request->user(),
            (int) $request->target_agent_id
        );

        return response()->json([
            'data' => (new ConversationResource($transferred))->resolve(),
            'message' => 'Conversation transferred successfully.',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $conversation = Conversation::findOrFail($id);
        Gate::authorize('delete', $conversation);

        $this->conversationService->deleteConversation($conversation, $request->user());

        return response()->json([
            'message' => 'Conversation deleted successfully.',
        ]);
    }
}
