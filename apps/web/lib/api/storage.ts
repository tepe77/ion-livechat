import { apiClient } from "./client";
import type { ApiResponse } from "@ion/types";

export interface StorageMetrics {
  disk: {
    total_bytes: number;
    total_formatted: string;
    free_bytes: number;
    free_formatted: string;
    used_bytes: number;
    used_formatted: string;
    used_percent: number;
  };
  attachments: {
    disk_bytes: number;
    disk_formatted: string;
    total_files: number;
    db_records: number;
  };
  database: {
    size_bytes: number;
    size_formatted: string;
    audit_logs_count: number;
    conversations_count: number;
    closed_conversations_count: number;
    messages_count: number;
  };
  retention: {
    retention_audit_logs_days: number;
    retention_attachments_days: number;
    auto_prune_enabled: boolean;
    last_pruned_at: string | null;
  };
}

export interface UpdateStorageRetentionPayload {
  retention_audit_logs_days: number;
  retention_attachments_days: number;
  auto_prune_enabled: boolean;
}

export interface PruneStoragePayload {
  dry_run?: boolean;
  prune_audit_logs?: boolean;
  prune_attachments?: boolean;
  clean_orphans?: boolean;
}

export interface PruneStorageResult {
  freed_bytes: number;
  freed_formatted: string;
  deleted_audit_logs_count: number;
  deleted_attachments_count: number;
  deleted_orphan_files_count: number;
  dry_run: boolean;
  executed_at: string;
}

/**
 * Superadmin: Fetch storage metrics, disk usage, and retention settings
 */
export async function getStorageMetrics(): Promise<StorageMetrics> {
  const res = await apiClient<ApiResponse<StorageMetrics>>("/admin/storage/metrics");
  return res.data;
}

/**
 * Superadmin: Update storage retention policies
 */
export async function updateStorageSettings(
  payload: UpdateStorageRetentionPayload
): Promise<ApiResponse<StorageMetrics>> {
  return apiClient<ApiResponse<StorageMetrics>>("/admin/storage/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Superadmin: Trigger manual storage cleanup (live or dry-run simulation)
 */
export async function pruneStorage(
  payload: PruneStoragePayload = {}
): Promise<ApiResponse<PruneStorageResult>> {
  return apiClient<ApiResponse<PruneStorageResult>>("/admin/storage/prune", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
