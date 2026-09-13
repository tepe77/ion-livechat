<?php

namespace App\Http\Controllers;

use App\Http\Requests\Rating\CreateRatingRequest;
use App\Http\Resources\RatingResource;
use App\Models\Conversation;
use App\Models\ConversationRating;
use App\Services\Rating\RatingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class RatingController extends Controller
{
    public function __construct(
        protected RatingService $ratingService
    ) {}

    public function store(CreateRatingRequest $request, int $conversationId): JsonResponse
    {
        $conversation = Conversation::findOrFail($conversationId);
        Gate::authorize('rate', $conversation);

        $rating = $this->ratingService->submitRating(
            $conversation,
            $request->user(),
            (int) $request->rating,
            $request->comment
        );

        return response()->json([
            'data' => (new RatingResource($rating->loadMissing(['agent', 'member'])))->resolve(),
            'message' => 'Rating submitted successfully.',
        ], 201);
    }

    public function show(int $conversationId): JsonResponse
    {
        $rating = ConversationRating::where('conversation_id', $conversationId)
            ->with(['agent', 'member'])
            ->firstOrFail();

        return response()->json([
            'data' => (new RatingResource($rating))->resolve(),
        ]);
    }
}
