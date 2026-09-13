<?php

namespace Tests\Feature;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\ConversationStatus;
use App\Enums\UserRole;
use App\Models\AgentProfile;
use App\Models\AgentStatus;
use App\Models\Conversation;
use App\Models\Role;
use App\Models\User;
use App\Services\Routing\RoutingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ConcurrencyRoutingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * P0 Concurrency Test:
     * 1 Agent, capacity = 5
     * 10 simultaneous conversation requests
     * Expected: 5 assigned, 5 waiting
     * Never: 6+ assigned
     */
    public function test_smart_routing_concurrency_capacity_protection(): void
    {
        Event::fake();

        $agentRole = Role::create(['name' => 'Agent', 'slug' => UserRole::AGENT->value]);
        $memberRole = Role::create(['name' => 'Member', 'slug' => UserRole::MEMBER->value]);

        $agent = User::create([
            'name' => 'Single Agent',
            'email' => 'singleagent@test.com',
            'password' => 'secret',
            'role_id' => $agentRole->id,
            'is_active' => true,
        ]);

        AgentProfile::create([
            'user_id' => $agent->id,
            'max_concurrent_conversations' => 5,
        ]);

        AgentStatus::create([
            'agent_id' => $agent->id,
            'presence' => AgentPresence::ONLINE,
            'availability' => AgentAvailability::AVAILABLE,
            'available_since' => now(),
        ]);

        // Create 10 different members
        $members = [];
        for ($i = 1; $i <= 10; $i++) {
            $members[] = User::create([
                'name' => "Member {$i}",
                'email' => "member{$i}@test.com",
                'password' => 'secret',
                'role_id' => $memberRole->id,
                'is_active' => true,
            ]);
        }

        // Create 10 conversations in WAITING status
        $conversations = [];
        foreach ($members as $member) {
            $conversations[] = Conversation::create([
                'member_id' => $member->id,
                'status' => ConversationStatus::WAITING,
                'started_at' => now(),
            ]);
        }

        $routingService = app(RoutingService::class);
        $assignedAgents = [];

        // Simulate concurrent routing requests
        foreach ($conversations as $conversation) {
            $assigned = $routingService->assignConversation($conversation);
            if ($assigned) {
                $assignedAgents[] = $assigned;
            }
        }

        $assignedCount = Conversation::where('status', ConversationStatus::ASSIGNED)->count();
        $waitingCount = Conversation::where('status', ConversationStatus::WAITING)->count();
        $agentActiveCount = Conversation::where('agent_id', $agent->id)
            ->whereIn('status', [ConversationStatus::ASSIGNED, ConversationStatus::ACTIVE])
            ->count();

        $this->assertEquals(5, $assignedCount, 'Exactly 5 conversations should be assigned.');
        $this->assertEquals(5, $waitingCount, 'Exactly 5 conversations should remain waiting.');
        $this->assertEquals(5, $agentActiveCount, 'Agent capacity of 5 must NEVER be exceeded.');
        $this->assertCount(5, $assignedAgents);
    }
}
