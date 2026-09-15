<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Agent\AgentService;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthController extends Controller
{
    public function __construct(
        protected AuditService $auditService,
        protected AgentService $agentService
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $memberRole = Role::where('slug', UserRole::MEMBER->value)->firstOrFail();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $memberRole->id,
            'is_active' => true,
        ]);

        $token = $user->createToken('api_token')->plainTextToken;

        $this->auditService->log($user, 'user.registered', 'User', $user->id);

        return response()->json([
            'data' => [
                'user' => (new UserResource($user))->resolve(),
                'token' => $token,
            ],
            'message' => 'Registration successful.',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account is deactivated. Please contact support.',
            ], 403);
        }

        $user->update(['last_login_at' => now()]);
        if ($user->isAgent()) {
            $this->agentService->recordHeartbeat($user);
        }
        $token = $user->createToken('api_token')->plainTextToken;

        $this->auditService->log($user, 'user.login', 'User', $user->id);

        return response()->json([
            'data' => [
                'user' => (new UserResource($user))->resolve(),
                'token' => $token,
            ],
            'message' => 'Login successful.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            if ($user->isAgent()) {
                $this->agentService->setAgentOffline($user);
            }

            $token = $user->currentAccessToken();
            if ($token && method_exists($token, 'delete')) {
                $token->delete();
            }

            $this->auditService->log($user, 'user.logout', 'User', $user->id);
        }

        return response()->json([
            'message' => 'Successfully logged out.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => (new UserResource($request->user()))->resolve(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'customer_number' => 'nullable|string|max:50',
            'avatar' => 'nullable|string|max:2048',
            'password' => 'nullable|string|min:8',
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (array_key_exists('customer_number', $validated)) {
            $user->customer_number = $validated['customer_number'];
        }

        if (array_key_exists('avatar', $validated)) {
            $user->avatar = $validated['avatar'];
        }

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        $this->auditService->log($user, 'user.profile_updated', 'User', $user->id);

        return response()->json([
            'data' => (new UserResource($user))->resolve(),
            'message' => 'Profile updated successfully.',
        ]);
    }

    public function oauthRedirect(string $provider)
    {
        if (!in_array($provider, ['google', 'facebook'])) {
            return response()->json(['message' => 'Unsupported OAuth provider.'], 400);
        }

        return Socialite::driver($provider)->stateless()->redirect();
    }

    public function oauthCallback(string $provider)
    {
        if (!in_array($provider, ['google', 'facebook'])) {
            return response()->json(['message' => 'Unsupported OAuth provider.'], 400);
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to authenticate with ' . ucfirst($provider)], 401);
        }

        // Check if social account already linked
        $socialAccount = SocialAccount::where('provider', $provider)
            ->where('provider_user_id', $socialUser->getId())
            ->first();

        if ($socialAccount) {
            $user = $socialAccount->user;
        } else {
            // Find existing user by email or create new member
            $user = User::where('email', $socialUser->getEmail())->first();

            if (!$user) {
                $memberRole = Role::where('slug', UserRole::MEMBER->value)->firstOrFail();
                $user = User::create([
                    'name' => $socialUser->getName() ?: $socialUser->getNickname() ?: 'Customer',
                    'email' => $socialUser->getEmail(),
                    'password' => Hash::make(bin2hex(random_bytes(16))),
                    'avatar' => $socialUser->getAvatar(),
                    'role_id' => $memberRole->id,
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]);
            }

            SocialAccount::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_user_id' => $socialUser->getId(),
                'provider_email' => $socialUser->getEmail(),
            ]);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('api_token')->plainTextToken;

        // Redirect to frontend with token parameter
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        return redirect()->to("{$frontendUrl}/oauth/callback?token={$token}");
    }
}
