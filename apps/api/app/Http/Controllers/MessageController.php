<?php

namespace App\Http\Controllers;

use App\Enums\MessageType;
use App\Http\Requests\Conversation\SendMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\Message\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MessageController extends Controller
{
    public function __construct(
        protected MessageService $messageService
    ) {}

    public function index(Request $request, int $conversationId): JsonResponse
    {
        $conversation = Conversation::findOrFail($conversationId);
        Gate::authorize('view', $conversation);

        $limit = min((int) $request->input('limit', 50), 100);
        $beforeId = $request->input('before');

        $query = Message::where('conversation_id', $conversationId)
            ->with(['sender', 'attachments'])
            ->orderBy('id', 'desc');

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        $messages = $query->limit($limit)->get()->reverse()->values();

        return response()->json([
            'data' => MessageResource::collection($messages)->resolve(),
            'meta' => [
                'count' => $messages->count(),
                'next_cursor' => $messages->isNotEmpty() ? $messages->first()->id : null,
            ],
        ]);
    }

    public function store(SendMessageRequest $request, int $conversationId): JsonResponse
    {
        $conversation = Conversation::findOrFail($conversationId);
        Gate::authorize('sendMessage', $conversation);

        $type = $request->has('type')
            ? MessageType::from($request->type)
            : MessageType::TEXT;

        // Process file attachments if uploaded
        $attachmentData = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $stored = $this->messageService->storeAttachment($conversation, $request->user(), $file);
                $attachmentData[] = $stored;
                if ($type === MessageType::TEXT) {
                    if (str_starts_with($stored['mime_type'], 'image/')) {
                        $type = MessageType::IMAGE;
                    } elseif (str_starts_with($stored['mime_type'], 'video/')) {
                        $type = MessageType::VIDEO;
                    } else {
                        $type = MessageType::FILE;
                    }
                }
            }
        }

        $content = $request->input('content', '') ?? '';

        $message = $this->messageService->sendMessage(
            $conversation,
            $request->user(),
            $type,
            $content,
            $attachmentData
        );

        return response()->json([
            'data' => (new MessageResource($message))->resolve(),
            'message' => 'Message sent.',
        ], 201);
    }

    public function markRead(Request $request, int $conversationId, int $messageId): JsonResponse
    {
        $conversation = Conversation::findOrFail($conversationId);
        Gate::authorize('view', $conversation);

        $message = $this->messageService->markAsRead($conversation, $request->user(), $messageId);

        return response()->json([
            'data' => (new MessageResource($message))->resolve(),
            'message' => 'Message marked as read.',
        ]);
    }

    public function uploadAttachment(Request $request, int $conversationId): JsonResponse
    {
        $conversation = Conversation::findOrFail($conversationId);
        Gate::authorize('sendMessage', $conversation);

        $request->validate([
            'file' => ['required', new \App\Rules\ValidChatAttachment()],
        ]);

        $stored = $this->messageService->storeAttachment($conversation, $request->user(), $request->file('file'));

        return response()->json([
            'data' => $stored,
            'message' => 'File uploaded successfully.',
        ]);
    }
}
