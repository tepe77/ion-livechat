<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    public function health(): JsonResponse
    {
        $dbStatus = 'ok';
        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $dbStatus = 'unhealthy: ' . $e->getMessage();
        }

        $redisStatus = 'ok';
        try {
            Redis::connection()->ping();
        } catch (\Throwable $e) {
            $redisStatus = 'unhealthy: ' . $e->getMessage();
        }

        $status = ($dbStatus === 'ok') ? 200 : 503;

        return response()->json([
            'status' => ($status === 200) ? 'healthy' : 'degraded',
            'timestamp' => now()->toISOString(),
            'services' => [
                'database' => $dbStatus,
                'redis' => $redisStatus,
            ],
        ], $status);
    }
}
