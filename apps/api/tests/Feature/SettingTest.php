<?php

namespace Tests\Feature;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\UserRole;
use App\Models\AgentProfile;
use App\Models\AgentStatus;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $superadmin;
    protected User $member;
    protected User $agent;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::create(['name' => 'Superadmin', 'slug' => UserRole::SUPERADMIN->value]);
        $memberRole = Role::create(['name' => 'Member', 'slug' => UserRole::MEMBER->value]);
        $agentRole = Role::create(['name' => 'Agent', 'slug' => UserRole::AGENT->value]);

        $this->superadmin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => 'secret',
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

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

    public function test_can_fetch_public_settings(): void
    {
        Setting::set('hotline_number', '1500-999');
        Setting::set('whatsapp_number', '628999888777');

        $response = $this->getJson('/api/v1/settings/public');

        $response->assertStatus(200)
            ->assertJsonPath('data.hotline_number', '1500-999')
            ->assertJsonPath('data.whatsapp_number', '628999888777')
            ->assertJsonPath('data.has_online_agents', true);
    }

    public function test_only_superadmin_can_access_admin_settings(): void
    {
        // Member should be rejected
        $this->actingAs($this->member)
            ->getJson('/api/v1/admin/settings')
            ->assertStatus(403);

        // Superadmin should succeed
        $this->actingAs($this->superadmin)
            ->getJson('/api/v1/admin/settings')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['hotline_number', 'whatsapp_number', 'operational_hours']]);
    }

    public function test_superadmin_can_update_settings(): void
    {
        $payload = [
            'hotline_number' => '021-5556667',
            'whatsapp_number' => '628111222333',
            'whatsapp_template' => 'Halo ION, internet saya terputus.',
            'operational_hours' => '24 Jam Nonstop',
            'livechat_enabled' => true,
        ];

        $response = $this->actingAs($this->superadmin)
            ->putJson('/api/v1/admin/settings', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.hotline_number', '021-5556667')
            ->assertJsonPath('data.whatsapp_number', '628111222333')
            ->assertJsonPath('data.operational_hours', '24 Jam Nonstop');

        $this->assertDatabaseHas('settings', [
            'key' => 'hotline_number',
            'value' => '021-5556667',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $this->superadmin->id,
            'action' => 'settings.updated',
        ]);
    }

    public function test_chat_blocked_when_livechat_disabled(): void
    {
        Setting::set('livechat_enabled', '0');

        $response = $this->actingAs($this->member)
            ->postJson('/api/v1/conversations');

        $response->assertStatus(422)
            ->assertJsonPath('code', 'LIVECHAT_DISABLED');
    }

    public function test_agent_presence_broadcasts_on_system_presence_channel(): void
    {
        $event = new \App\Events\AgentStatusUpdated(
            $this->agent->id,
            AgentPresence::ONLINE,
            AgentAvailability::AVAILABLE
        );

        $channels = $event->broadcastOn();
        $channelNames = array_map(fn($c) => (string) $c, $channels);
        $this->assertContains('system.presence', $channelNames);

        $payload = $event->broadcastWith();
        $this->assertArrayHasKey('has_online_agents', $payload);
        $this->assertTrue($payload['has_online_agents']);
    }
}
