import { apiClient } from "./client";
import type { AgentPerformance, ApiPaginatedResponse, ApiResponse, Conversation, DashboardStats, User } from "@ion/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient<ApiResponse<DashboardStats>>("/manager/dashboard");
  return res.data;
}

export async function getManagerAgents(params?: {
  presence?: string;
  availability?: string;
  page?: number;
  per_page?: number;
}): Promise<ApiPaginatedResponse<User>> {
  return apiClient<ApiPaginatedResponse<User>>("/manager/agents", { params: params as any });
}

export async function createAgent(payload: {
  name: string;
  email: string;
  password: string;
  max_concurrent_conversations?: number;
}): Promise<User> {
  const res = await apiClient<ApiResponse<User>>("/manager/agents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateAgent(
  agentId: number,
  payload: {
    name?: string;
    email?: string;
    password?: string;
    is_active?: boolean;
    max_concurrent_conversations?: number;
  }
): Promise<User> {
  const res = await apiClient<ApiResponse<User>>(`/manager/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function getAgentPerformance(agentId: number): Promise<AgentPerformance> {
  const res = await apiClient<ApiResponse<AgentPerformance>>(`/manager/agents/${agentId}/performance`);
  return res.data;
}

export async function getMonitoredConversations(params?: {
  status?: string;
  agent_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}): Promise<ApiPaginatedResponse<Conversation>> {
  return apiClient<ApiPaginatedResponse<Conversation>>("/manager/conversations", { params: params as any });
}

