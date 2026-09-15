<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\Audit\AuditService;
use App\Services\Routing\RoutingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function __construct(
        protected AuditService $auditService,
        protected RoutingService $routingService
    ) {}

    /**
     * Public / member accessible emergency contacts and status
     */
    public function publicSettings(): JsonResponse
    {
        $settings = Setting::getAllKeyValues();
        $hasOnlineAgents = $this->routingService->hasOnlineAgents();

        return response()->json([
            'data' => [
                'hotline_number' => $settings['hotline_number'] ?? '1500-ION',
                'whatsapp_number' => $settings['whatsapp_number'] ?? '6281234567890',
                'whatsapp_template' => $settings['whatsapp_template'] ?? 'Halo Tim ION Broadband, saya ingin melaporkan kendala koneksi internet saya.',
                'operational_hours' => $settings['operational_hours'] ?? 'Senin - Minggu, 08:00 - 22:00 WIB',
                'livechat_enabled' => ($settings['livechat_enabled'] ?? '1') === '1',
                'has_online_agents' => $hasOnlineAgents,
            ],
        ]);
    }

    /**
     * Admin view all system settings
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isSuperadmin()) {
            return response()->json(['message' => 'Unauthorized. Superadmin role required.'], 403);
        }

        $settings = Setting::getAllKeyValues();
        $hasOnlineAgents = $this->routingService->hasOnlineAgents();

        return response()->json([
            'data' => [
                'hotline_number' => $settings['hotline_number'] ?? '1500-ION',
                'whatsapp_number' => $settings['whatsapp_number'] ?? '6281234567890',
                'whatsapp_template' => $settings['whatsapp_template'] ?? 'Halo Tim ION Broadband, saya ingin melaporkan kendala koneksi internet saya.',
                'operational_hours' => $settings['operational_hours'] ?? 'Senin - Minggu, 08:00 - 22:00 WIB',
                'livechat_enabled' => ($settings['livechat_enabled'] ?? '1') === '1',
                'has_online_agents' => $hasOnlineAgents,
            ],
        ]);
    }

    /**
     * Admin update system settings
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isSuperadmin()) {
            return response()->json(['message' => 'Unauthorized. Superadmin role required.'], 403);
        }

        $validated = $request->validate([
            'hotline_number' => 'required|string|max:50',
            'whatsapp_number' => 'required|string|max:50',
            'whatsapp_template' => 'nullable|string|max:500',
            'operational_hours' => 'required|string|max:100',
            'livechat_enabled' => 'nullable|boolean',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        $this->auditService->log(
            $user,
            'settings.updated',
            'Setting',
            null,
            $validated
        );

        $settings = Setting::getAllKeyValues();
        $hasOnlineAgents = $this->routingService->hasOnlineAgents();

        return response()->json([
            'message' => 'Pengaturan kontak dan operasional berhasil diperbarui.',
            'data' => [
                'hotline_number' => $settings['hotline_number'] ?? '1500-ION',
                'whatsapp_number' => $settings['whatsapp_number'] ?? '6281234567890',
                'whatsapp_template' => $settings['whatsapp_template'] ?? 'Halo Tim ION Broadband, saya ingin melaporkan kendala koneksi internet saya.',
                'operational_hours' => $settings['operational_hours'] ?? 'Senin - Minggu, 08:00 - 22:00 WIB',
                'livechat_enabled' => ($settings['livechat_enabled'] ?? '1') === '1',
                'has_online_agents' => $hasOnlineAgents,
            ],
        ]);
    }
}
