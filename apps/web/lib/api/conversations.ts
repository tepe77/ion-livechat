import { apiClient } from "./client";
import type { ApiPaginatedResponse, ApiResponse, Conversation } from "@ion/types";

export interface ListConversationsParams {
  page?: number;
  per_page?: number;
  status?: string;
}

export async function getConversations(params?: ListConversationsParams): Promise<ApiPaginatedResponse<Conversation>> {
  return apiClient<ApiPaginatedResponse<Conversation>>("/conversations", { params: params as any });
}

export async function getConversation(id: number): Promise<Conversation> {
  const res = await apiClient<ApiResponse<Conversation>>(`/conversations/${id}`);
  return res.data;
}

export async function startConversation(): Promise<Conversation> {
  const res = await apiClient<ApiResponse<Conversation>>("/conversations", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return res.data;
}

export async function closeConversation(id: number): Promise<Conversation> {
  const res = await apiClient<ApiResponse<Conversation>>(`/conversations/${id}/close`, {
    method: "POST",
  });
  return res.data;
}

export async function transferConversation(id: number, targetAgentId: number): Promise<Conversation> {
  const res = await apiClient<ApiResponse<Conversation>>(`/conversations/${id}/transfer`, {
    method: "POST",
    body: JSON.stringify({ target_agent_id: targetAgentId }),
  });
  return res.data;
}

export async function deleteConversation(id: number): Promise<void> {
  await apiClient<ApiResponse<void>>(`/conversations/${id}`, {
    method: "DELETE",
  });
}
