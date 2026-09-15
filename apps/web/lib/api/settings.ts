import { apiClient } from "./client";
import type { ApiResponse } from "@ion/types";

export interface SystemSettings {
  hotline_number: string;
  whatsapp_number: string;
  whatsapp_template: string;
  operational_hours: string;
  livechat_enabled: boolean;
  has_online_agents?: boolean;
}

export interface UpdateSettingsPayload {
  hotline_number: string;
  whatsapp_number: string;
  whatsapp_template?: string;
  operational_hours: string;
  livechat_enabled?: boolean;
}

/**
 * Fetch publicly accessible emergency contacts and livechat operational status
 */
export async function getPublicSettings(): Promise<SystemSettings> {
  const res = await apiClient<ApiResponse<SystemSettings>>("/settings/public");
  return res.data;
}

/**
 * Superadmin fetch all system configuration
 */
export async function getAdminSettings(): Promise<SystemSettings> {
  const res = await apiClient<ApiResponse<SystemSettings>>("/admin/settings");
  return res.data;
}

/**
 * Superadmin update system configuration
 */
export async function updateAdminSettings(payload: UpdateSettingsPayload): Promise<ApiResponse<SystemSettings>> {
  return apiClient<ApiResponse<SystemSettings>>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
