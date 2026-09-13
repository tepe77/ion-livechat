import { apiClient } from "./client";
import type { ApiPaginatedResponse, ApiResponse, AuditLog, User } from "@ion/types";

export interface RoleWithPermissions {
  id: number;
  name: string;
  slug: string;
  permissions: Array<{ id: number; name: string; slug: string }>;
}

export async function getAdminUsers(params?: { role?: string; search?: string; page?: number }): Promise<ApiPaginatedResponse<User>> {
  return apiClient<ApiPaginatedResponse<User>>("/admin/users", { params: params as any });
}

export async function updateAdminUser(
  userId: number,
  payload: { name?: string; email?: string; role_id?: number; is_active?: boolean }
): Promise<User> {
  const res = await apiClient<ApiResponse<User>>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function getRoles(): Promise<RoleWithPermissions[]> {
  const res = await apiClient<ApiResponse<RoleWithPermissions[]>>("/admin/roles");
  return res.data;
}

export async function getAuditLogs(params?: { action?: string; actor_id?: number; page?: number }): Promise<ApiPaginatedResponse<AuditLog>> {
  return apiClient<ApiPaginatedResponse<AuditLog>>("/admin/audit-logs", { params: params as any });
}
