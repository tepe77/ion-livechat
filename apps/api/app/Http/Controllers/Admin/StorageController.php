<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\Storage\StorageManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StorageController extends Controller
{
    public function __construct(
        protected StorageManagementService $storageService
    ) {}

    /**
     * Ensure current user has superadmin role.
     */
    protected function authorizeSuperadmin(Request $request): ?JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isSuperadmin()) {
            return response()->json(['message' => 'Unauthorized. Superadmin role required.'], 403);
        }
        return null;
    }

    /**
     * Get system storage metrics and current retention settings.
     */
    public function metrics(Request $request): JsonResponse
    {
        if ($deny = $this->authorizeSuperadmin($request)) {
            return $deny;
        }

        $metrics = $this->storageService->getMetrics();

        return response()->json([
            'data' => $metrics,
        ]);
    }

    /**
     * Update storage retention policies.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        if ($deny = $this->authorizeSuperadmin($request)) {
            return $deny;
        }

        $validated = $request->validate([
            'retention_audit_logs_days' => ['required', 'integer', 'min:7', 'max:3650'],
            'retention_attachments_days' => ['required', 'integer', 'min:0', 'max:3650'],
            'auto_prune_enabled' => ['required', 'boolean'],
        ]);

        Setting::set('retention_audit_logs_days', $validated['retention_audit_logs_days']);
        Setting::set('retention_attachments_days', $validated['retention_attachments_days']);
        Setting::set('auto_prune_enabled', $validated['auto_prune_enabled'] ? '1' : '0');

        return response()->json([
            'data' => $this->storageService->getMetrics(),
            'message' => 'Kebijakan retensi penyimpanan berhasil diperbarui.',
        ]);
    }

    /**
     * Trigger manual storage cleanup.
     */
    public function prune(Request $request): JsonResponse
    {
        if ($deny = $this->authorizeSuperadmin($request)) {
            return $deny;
        }

        $validated = $request->validate([
            'dry_run' => ['nullable', 'boolean'],
            'prune_audit_logs' => ['nullable', 'boolean'],
            'prune_attachments' => ['nullable', 'boolean'],
            'clean_orphans' => ['nullable', 'boolean'],
        ]);

        $summary = $this->storageService->prune($validated, $request->user());

        return response()->json([
            'data' => $summary,
            'message' => $summary['dry_run']
                ? 'Simulasi pembersihan penyimpanan selesai.'
                : 'Pembersihan penyimpanan berhasil diselesaikan.',
        ]);
    }
}
