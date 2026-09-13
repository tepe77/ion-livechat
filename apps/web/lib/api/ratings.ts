import { apiClient } from "./client";
import type { ApiResponse, ConversationRating } from "@ion/types";

export interface SubmitRatingPayload {
  rating: number; // 1 - 5
  comment?: string;
}

export async function submitRating(conversationId: number, payload: SubmitRatingPayload): Promise<ConversationRating> {
  const res = await apiClient<ApiResponse<ConversationRating>>(`/conversations/${conversationId}/rating`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function getRating(conversationId: number): Promise<ConversationRating> {
  const res = await apiClient<ApiResponse<ConversationRating>>(`/conversations/${conversationId}/rating`);
  return res.data;
}
