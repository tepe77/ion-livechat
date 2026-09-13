<?php

namespace Tests\Unit;

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

class RoutingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected RoutingService $routingService;
    protected Role $agentRole;
    protected Role $memberRole;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();

        $this->routingService = app(RoutingService::class);
        $this->agentRole = Role::create(['name' => 'Agent', 'slug' => UserRole::AGENT->value]);
        $this->memberRole = Role::create(['name' => 'Member', 'slug' => UserRole::MEMBER->value]);
    }

    private function createAgent(string $name, int $capacity = 5, AgentPresence $presence = AgentPresence::ONLINE, AgentAvailability $availability = AgentAvailability::AVAILABLE, $availableSince = null): User
    {
        $agent = User::create([
            'name' => $name,
            'email' => strtolower(str_replace(' ', '', $name)) . '@test.com',
            'password' => 'secret',
            'role_id' => $this->agentRole->id,
            'is_active' => true,
        ]);

        AgentProfile::create([
            'user_id' => $agent->id,
            'max_concurrent_conversations' => $capacity,
        ]);

        AgentStatus::create([
            'agent_id' => $agent->id,
            'presence' => $presence,
            'availability' => $availability,
            'available_since' => $availableSince ?? now(),
        ]);

        return $agent;
    }

    private function createMember(): User
    {
        return User::create([
            'name' => 'Member ' . uniqid(),
            'email' => 'member' . uniqid() . '@test.com',
            'password' => 'secret',
            'role_id' => $this->memberRole->id,
            'is_active' => true,
        ]);
    }

    public function test_selects_agent_with_lowest_active_workload(): void
    {
        $agentA = $this->createAgent('Agent A');
        $agentB = $this->createAgent('Agent B');
        $agentC = $this->createAgent('Agent C');

        $member = $this->createMember();

        // Agent A has 2 active
        Conversation::create(['member_id' => $member->id, 'agent_id' => $agentA->id, 'status' => ConversationStatus::ACTIVE, 'started_at' => now()]);
        Conversation::create(['member_id' => $member->id, 'agent_id' => $agentA->id, 'status' => ConversationStatus::ACTIVE, 'started_at' => now()]);

        // Agent B has 4 active
        for ($i = 0; $i < 4; $i++) {
            Conversation::create(['member_id' => $member->id, 'agent_id' => $agentB->id, 'status' => ConversationStatus::ACTIVE, 'started_at' => now()]);
        }

        // Agent C has 1 active
        Conversation::create(['member_id' => $member->id, 'agent_id' => $agentC->id, 'status' => ConversationStatus::ACTIVE, 'started_at' => now()]);

        $newConversation = Conversation::create([
            'member_id' => $member->id,
            'status' => ConversationStatus::WAITING,
            'started_at' => now(),
        ]);

        $assignedAgent = $this->routingService->assignConversation($newConversation);

        $this->assertNotNull($assignedAgent);
        $this->assertEquals($agentC->id, $assignedAgent->id);
        $this->assertEquals(ConversationStatus::ASSIGNED, $newConversation->fresh()->status);
    }

    public function test_breaks_tie_with_longest_available_since(): void
    {
        // Both have 0 active, but Agent A has been available longer
        $agentA = $this->createAgent('Agent A', 5, AgentPresence::ONLINE, AgentAvailability::AVAILABLE, now()->subHours(3));
        $agentB = $this->createAgent('Agent B', 5, AgentPresence::ONLINE, AgentAvailability::AVAILABLE, now()->subHour());

        $member = $this->createMember();

        $newConversation = Conversation::create([
            'member_id' => $member->id,
            'status' => ConversationStatus::WAITING,
            'started_at' => now(),
        ]);

        $assignedAgent = $this->routingService->assignConversation($newConversation);

        $this->assertNotNull($assignedAgent);
        $this->assertEquals($agentA->id, $assignedAgent->id);
    }

    public function test_skips_agent_at_maximum_capacity(): void
    {
        $agentA = $this->createAgent('Agent A', 2); // capacity 2
        $agentB = $this->createAgent('Agent B', 5); // capacity 5

        $member = $this->createMember();

        // Fill Agent A to 2/2
        Conversation::create(['member_id' => $member->id, 'agent_id' => $agentA->id, 'status' => ConversationStatus::ACTIVE, 'started_at' => now()]);
        Conversation::create(['member_id' => $member->id, 'agent_id' => $agentA->id, 'status' => ConversationStatus::ACTIVE, 'started_at' => now()]);

        // Agent B has 1 active
        Conversation::create(['member_id' => $member->id, 'agent_id' => $agentB->id, 'status' => ConversationStatus::ACTIVE, 'started_at' => now()]);

        $newConversation = Conversation::create([
            'member_id' => $member->id,
            'status' => ConversationStatus::WAITING,
            'started_at' => now(),
        ]);

        $assignedAgent = $this->routingService->assignConversation($newConversation);

        $this->assertNotNull($assignedAgent);
        $this->assertEquals($agentB->id, $assignedAgent->id);
    }

    public function test_puts_conversation_in_waiting_when_all_agents_busy_or_offline(): void
    {
        $agentOffline = $this->createAgent('Agent Off', 5, AgentPresence::OFFLINE, AgentAvailability::AVAILABLE);
        $agentAway = $this->createAgent('Agent Away', 5, AgentPresence::ONLINE, AgentAvailability::AWAY);

        $member = $this->createMember();

        $newConversation = Conversation::create([
            'member_id' => $member->id,
            'status' => ConversationStatus::WAITING,
            'started_at' => now(),
        ]);

        $assignedAgent = $this->routingService->assignConversation($newConversation);

        $this->assertNull($assignedAgent);
        $this->assertEquals(ConversationStatus::WAITING, $newConversation->fresh()->status);
    }
}
