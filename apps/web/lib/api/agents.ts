import { apiClient } from "./client";
import type { AgentAvailability, AgentStatus, ApiPaginatedResponse, ApiResponse, Conversation } from "@ion/types";

export async function getAgentConversations(params?: { status?: string; page?: number }): Promise<ApiPaginatedResponse<Conversation>> {
  return apiClient<ApiPaginatedResponse<Conversation>>("/agent/conversations", { params: params as any });
}

export async function getAgentStatus(): Promise<AgentStatus> {
  const res = await apiClient<ApiResponse<AgentStatus>>("/agent/status");
  return res.data;
}

export async function updateAgentStatus(availability: AgentAvailability): Promise<AgentStatus> {
  const res = await apiClient<ApiResponse<AgentStatus>>("/agent/status", {
    method: "PATCH",
    body: JSON.stringify({ availability }),
  });
  return res.data;
}

export async function sendHeartbeat(): Promise<AgentStatus> {
  const res = await apiClient<ApiResponse<AgentStatus>>("/agent/heartbeat", {
    method: "POST",
  });
  return res.data;
}
