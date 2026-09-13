<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\ManagerController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\RatingController;
use Illuminate\Support\Facades\Route;

// Health Check
Route::get('/health', [HealthController::class, 'health']);

// Public Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/oauth/{provider}', [AuthController::class, 'oauthRedirect']);
    Route::get('/oauth/{provider}/callback', [AuthController::class, 'oauthCallback']);
});

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Broadcasting authentication
    Route::match(['get', 'post'], '/broadcasting/auth', [Illuminate\Broadcasting\BroadcastController::class, 'authenticate']);

    // Auth & User Profile
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/profile', [AuthController::class, 'updateProfile']);
    });

    // Conversations
    Route::prefix('conversations')->group(function () {
        Route::get('/', [ConversationController::class, 'index']);
        Route::post('/', [ConversationController::class, 'store']);
        Route::get('/{id}', [ConversationController::class, 'show']);
        Route::post('/{id}/close', [ConversationController::class, 'close']);
        Route::post('/{id}/transfer', [ConversationController::class, 'transfer']);
        Route::delete('/{id}', [ConversationController::class, 'destroy']);

        // Messages & Attachments
        Route::get('/{id}/messages', [MessageController::class, 'index']);
        Route::post('/{id}/messages', [MessageController::class, 'store']);
        Route::post('/{id}/messages/{messageId}/read', [MessageController::class, 'markRead']);
        Route::post('/{id}/attachments', [MessageController::class, 'uploadAttachment']);

        // Ratings
        Route::post('/{id}/rating', [RatingController::class, 'store']);
        Route::get('/{id}/rating', [RatingController::class, 'show']);
    });

    // Agent Workspace
    Route::prefix('agent')->group(function () {
        Route::get('/conversations', [AgentController::class, 'conversations']);
        Route::get('/status', [AgentController::class, 'getStatus']);
        Route::patch('/status', [AgentController::class, 'updateStatus']);
        Route::post('/heartbeat', [AgentController::class, 'heartbeat']);
    });

    // Manager Dashboard & Supervision
    Route::prefix('manager')->group(function () {
        Route::get('/dashboard', [ManagerController::class, 'dashboard']);
        Route::get('/agents', [ManagerController::class, 'agents']);
        Route::post('/agents', [ManagerController::class, 'createAgent']);
        Route::get('/agents/{agentId}', [ManagerController::class, 'agentDetail']);
        Route::patch('/agents/{agentId}', [ManagerController::class, 'updateAgent']);
        Route::get('/agents/{agentId}/performance', [ManagerController::class, 'agentPerformance']);
        Route::get('/conversations', [ManagerController::class, 'conversations']);
    });

    // Superadmin Governance
    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{id}', [AdminController::class, 'updateUser']);
        Route::get('/roles', [AdminController::class, 'roles']);
        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);
    });
});
