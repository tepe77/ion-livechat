<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    public function users(Request $request): JsonResponse
    {
        $query = User::with('role')->orderBy('id', 'asc');

        if ($request->filled('role')) {
            $query->whereHas('role', fn ($q) => $q->where('slug', $request->role));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', $search)
                    ->orWhere('email', 'ilike', $search);
            });
        }

        $users = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'data' => UserResource::collection($users)->resolve(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function updateUser(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $user->update($request->only(['name', 'email', 'role_id', 'is_active']));

        $this->auditService->log(
            $request->user(),
            'user.updated',
            'User',
            $user->id,
            $request->validated()
        );

        return response()->json([
            'data' => (new UserResource($user->load('role')))->resolve(),
            'message' => 'User updated successfully.',
        ]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::with('permissions')->get();

        return response()->json([
            'data' => $roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'permissions' => $role->permissions->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                ]),
            ]),
        ]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::with('actor')->orderBy('created_at', 'desc');

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->actor_id);
        }

        $logs = $query->paginate($request->input('per_page', 30));

        return response()->json([
            'data' => AuditLogResource::collection($logs)->resolve(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
