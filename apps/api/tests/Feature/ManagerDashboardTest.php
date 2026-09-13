<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ManagerDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $manager;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();

        $managerRole = Role::create(['name' => 'Manager', 'slug' => UserRole::MANAGER->value]);

        $this->manager = User::create([
            'name' => 'Manager SPV',
            'email' => 'manager@ion.test',
            'password' => 'secret',
            'role_id' => $managerRole->id,
            'is_active' => true,
        ]);
    }

    public function test_manager_can_access_dashboard_metrics_without_syntax_error(): void
    {
        $response = $this->actingAs($this->manager)
            ->getJson('/api/v1/manager/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'waiting',
                    'active',
                    'closed_today',
                    'online_agents',
                    'available_agents',
                    'average_first_response_time',
                    'average_resolution_time',
                    'average_rating',
                ],
            ]);
    }

    public function test_manager_can_update_profile_and_avatar(): void
    {
        $avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

        $response = $this->actingAs($this->manager)
            ->patchJson('/api/v1/auth/profile', [
                'name' => 'Manager SPV Updated',
                'avatar' => $avatarUrl,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Manager SPV Updated')
            ->assertJsonPath('data.avatar', $avatarUrl);

        $this->assertEquals('Manager SPV Updated', $this->manager->fresh()->name);
        $this->assertEquals($avatarUrl, $this->manager->fresh()->avatar);
    }
}
