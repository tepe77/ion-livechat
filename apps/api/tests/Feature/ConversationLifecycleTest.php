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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ConversationLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected User $member;
    protected User $agent;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();

        $memberRole = Role::create(['name' => 'Member', 'slug' => UserRole::MEMBER->value]);
        $agentRole = Role::create(['name' => 'Agent', 'slug' => UserRole::AGENT->value]);

        $this->member = User::create([
            'name' => 'Member User',
            'email' => 'member@example.com',
            'password' => 'secret',
            'role_id' => $memberRole->id,
            'is_active' => true,
        ]);

        $this->agent = User::create([
            'name' => 'Agent User',
            'email' => 'agent@example.com',
            'password' => 'secret',
            'role_id' => $agentRole->id,
            'is_active' => true,
        ]);

        AgentProfile::create([
            'user_id' => $this->agent->id,
            'max_concurrent_conversations' => 5,
        ]);

        AgentStatus::create([
            'agent_id' => $this->agent->id,
            'presence' => AgentPresence::ONLINE,
            'availability' => AgentAvailability::AVAILABLE,
            'available_since' => now(),
        ]);
    }

    public function test_complete_conversation_lifecycle_and_rating(): void
    {
        // 1. Member starts conversation
        $startResponse = $this->actingAs($this->member)
            ->postJson('/api/v1/conversations');

        $startResponse->assertStatus(201)
            ->assertJsonPath('data.status', ConversationStatus::ASSIGNED->value)
            ->assertJsonPath('data.agent.id', $this->agent->id);

        $conversationId = $startResponse->json('data.id');

        // 2. Member sends message
        $memberMsgResponse = $this->actingAs($this->member)
            ->postJson("/api/v1/conversations/{$conversationId}/messages", [
                'type' => 'text',
                'content' => 'Hello support team!',
            ]);

        $memberMsgResponse->assertStatus(201)
            ->assertJsonPath('data.content', 'Hello support team!');

        $messageId = $memberMsgResponse->json('data.id');

        // 3. Agent reads message
        $readResponse = $this->actingAs($this->agent)
            ->postJson("/api/v1/conversations/{$conversationId}/messages/{$messageId}/read");

        $readResponse->assertStatus(200);

        // 4. Agent replies -> transitions status to ACTIVE and records first_response_at
        $agentMsgResponse = $this->actingAs($this->agent)
            ->postJson("/api/v1/conversations/{$conversationId}/messages", [
                'type' => 'text',
                'content' => 'Hello! How can I help you today?',
            ]);

        $agentMsgResponse->assertStatus(201);

        $conversation = Conversation::find($conversationId);
        $this->assertEquals(ConversationStatus::ACTIVE, $conversation->status);
        $this->assertNotNull($conversation->first_response_at);

        // 5. Agent closes conversation
        $closeResponse = $this->actingAs($this->agent)
            ->postJson("/api/v1/conversations/{$conversationId}/close");

        $closeResponse->assertStatus(200)
            ->assertJsonPath('data.status', ConversationStatus::CLOSED->value);

        $this->assertEquals(ConversationStatus::CLOSED, $conversation->fresh()->status);
        $this->assertNotNull($conversation->fresh()->closed_at);

        // 6. Member rates conversation (5 stars)
        $ratingResponse = $this->actingAs($this->member)
            ->postJson("/api/v1/conversations/{$conversationId}/rating", [
                'rating' => 5,
                'comment' => 'Excellent fast service!',
            ]);

        $ratingResponse->assertStatus(201)
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.comment', 'Excellent fast service!');

        // 7. Duplicate rating must be rejected
        $dupRatingResponse = $this->actingAs($this->member)
            ->postJson("/api/v1/conversations/{$conversationId}/rating", [
                'rating' => 4,
            ]);

        $dupRatingResponse->assertStatus(409);

        // 8. Sending message to closed conversation must be rejected
        $closedMsgResponse = $this->actingAs($this->member)
            ->postJson("/api/v1/conversations/{$conversationId}/messages", [
                'content' => 'Another message after close',
            ]);

        $closedMsgResponse->assertStatus(409);
    }

    public function test_authorization_prevents_unauthorized_member_access(): void
    {
        $otherMember = User::create([
            'name' => 'Other Member',
            'email' => 'other@example.com',
            'password' => 'secret',
            'role_id' => $this->member->role_id,
            'is_active' => true,
        ]);

        $startResponse = $this->actingAs($this->member)
            ->postJson('/api/v1/conversations');
        $conversationId = $startResponse->json('data.id');

        // Other member cannot view
        $this->actingAs($otherMember)
            ->getJson("/api/v1/conversations/{$conversationId}")
            ->assertStatus(403);

        // Other member cannot send messages
        $this->actingAs($otherMember)
            ->postJson("/api/v1/conversations/{$conversationId}/messages", ['content' => 'Hacking in'])
            ->assertStatus(403);

        // Other member cannot close
        $this->actingAs($otherMember)
            ->postJson("/api/v1/conversations/{$conversationId}/close")
            ->assertStatus(403);
    }

    public function test_member_can_close_own_conversation(): void
    {
        $startResponse = $this->actingAs($this->member)
            ->postJson('/api/v1/conversations');
        $conversationId = $startResponse->json('data.id');

        $closeResponse = $this->actingAs($this->member)
            ->postJson("/api/v1/conversations/{$conversationId}/close");

        $closeResponse->assertStatus(200)
            ->assertJsonPath('data.status', ConversationStatus::CLOSED->value);

        $conversation = Conversation::find($conversationId);
        $this->assertEquals(ConversationStatus::CLOSED, $conversation->status);
        $this->assertNotNull($conversation->closed_at);
    }

    public function test_member_can_delete_own_conversation(): void
    {
        $startResponse = $this->actingAs($this->member)
            ->postJson('/api/v1/conversations');
        $conversationId = $startResponse->json('data.id');

        // Delete the conversation
        $deleteResponse = $this->actingAs($this->member)
            ->deleteJson("/api/v1/conversations/{$conversationId}");

        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('conversations', ['id' => $conversationId]);
    }

    public function test_unauthorized_member_cannot_delete_other_conversation(): void
    {
        $otherMember = User::create([
            'name' => 'Unrelated Member',
            'email' => 'unrelated@example.com',
            'password' => 'secret',
            'role_id' => $this->member->role_id,
            'is_active' => true,
        ]);

        $startResponse = $this->actingAs($this->member)
            ->postJson('/api/v1/conversations');
        $conversationId = $startResponse->json('data.id');

        // Unrelated member cannot delete
        $this->actingAs($otherMember)
            ->deleteJson("/api/v1/conversations/{$conversationId}")
            ->assertStatus(403);

        $this->assertDatabaseHas('conversations', ['id' => $conversationId]);
    }

    public function test_member_can_update_profile_and_customer_number(): void
    {
        $response = $this->actingAs($this->member)
            ->patchJson('/api/v1/auth/profile', [
                'name' => 'Budi Customer Updated',
                'customer_number' => 'ION-998877',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Budi Customer Updated')
            ->assertJsonPath('data.customer_number', 'ION-998877');

        $this->assertEquals('Budi Customer Updated', $this->member->fresh()->name);
        $this->assertEquals('ION-998877', $this->member->fresh()->customer_number);
    }

    public function test_agent_logout_sets_presence_offline_and_subsequent_chat_goes_to_waiting(): void
    {
        // 1. Agent logs out
        $logoutResponse = $this->actingAs($this->agent)
            ->postJson('/api/v1/auth/logout');
        $logoutResponse->assertStatus(200);

        // 2. Verify agent status is now offline in database
        $this->assertEquals(AgentPresence::OFFLINE, $this->agent->agentStatus->fresh()->presence);

        // 3. Member initiates a new conversation
        $startResponse = $this->actingAs($this->member)
            ->postJson('/api/v1/conversations');

        // 4. Since no agent is online, conversation must be WAITING with no agent assigned
        $startResponse->assertStatus(201)
            ->assertJsonPath('data.status', ConversationStatus::WAITING->value)
            ->assertJsonPath('data.agent', null);

        $conversationId = $startResponse->json('data.id');
        $this->assertDatabaseHas('conversations', [
            'id' => $conversationId,
            'status' => ConversationStatus::WAITING->value,
            'agent_id' => null,
        ]);
    }
}
