<?php

namespace App\Http\Controllers;

use App\Http\Requests\Conversation\TransferConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\Setting;
use App\Services\Conversation\ConversationService;
use App\Services\Routing\RoutingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ConversationController extends Controller
{
    public function __construct(
        protected ConversationService $conversationService,
        protected RoutingService $routingService
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

        $settings = Setting::getAllKeyValues();

        // Check if livechat is disabled by admin
        if (($settings['livechat_enabled'] ?? '1') === '0') {
            return response()->json([
                'code' => 'LIVECHAT_DISABLED',
                'message' => 'Layanan obrolan langsung sedang dinonaktifkan sementara oleh sistem.',
                'contacts' => [
                    'hotline_number' => $settings['hotline_number'] ?? '1500-ION',
                    'whatsapp_number' => $settings['whatsapp_number'] ?? '6281234567890',
                    'whatsapp_template' => $settings['whatsapp_template'] ?? '',
                    'operational_hours' => $settings['operational_hours'] ?? 'Senin - Minggu, 08:00 - 22:00 WIB',
                ],
            ], 422);
        }

        // Instant Pre-Check: If 0 agents are online, reject with emergency contacts without creating an empty session
        if (! $this->routingService->hasOnlineAgents()) {
            return response()->json([
                'code' => 'NO_AGENTS_ONLINE',
                'message' => 'Saat ini seluruh petugas Customer Service kami sedang tidak bertugas atau di luar jam operasional.',
                'contacts' => [
                    'hotline_number' => $settings['hotline_number'] ?? '1500-ION',
                    'whatsapp_number' => $settings['whatsapp_number'] ?? '6281234567890',
                    'whatsapp_template' => $settings['whatsapp_template'] ?? '',
                    'operational_hours' => $settings['operational_hours'] ?? 'Senin - Minggu, 08:00 - 22:00 WIB',
                ],
            ], 422);
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
