<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserFilterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic roles
        Role::firstOrCreate(['slug' => 'superadmin'], ['name' => 'Superadmin']);
        Role::firstOrCreate(['slug' => 'agent'], ['name' => 'Agent CS']);
        Role::firstOrCreate(['slug' => 'member'], ['name' => 'Member']);
    }

    public function test_can_filter_active_and_inactive_users(): void
    {
        $admin = User::factory()->create([
            'role_id' => Role::where('slug', 'superadmin')->first()->id,
            'is_active' => true,
        ]);

        // Create 2 active members and 1 inactive member
        $memberRole = Role::where('slug', 'member')->first();
        User::factory()->count(2)->create([
            'role_id' => $memberRole->id,
            'is_active' => true,
        ]);
        User::factory()->create([
            'role_id' => $memberRole->id,
            'is_active' => false,
        ]);

        // Request without filter
        $response = $this->actingAs($admin)->getJson('/api/v1/admin/users');
        $response->assertOk();
        $response->assertJsonPath('meta.total_count', 4);
        $response->assertJsonPath('meta.active_count', 3); // 1 admin + 2 members
        $response->assertJsonPath('meta.inactive_count', 1);

        // Filter status = active
        $responseActive = $this->actingAs($admin)->getJson('/api/v1/admin/users?status=active');
        $responseActive->assertOk();
        $this->assertCount(3, $responseActive->json('data'));
        foreach ($responseActive->json('data') as $u) {
            $this->assertTrue($u['is_active']);
        }

        // Filter status = inactive
        $responseInactive = $this->actingAs($admin)->getJson('/api/v1/admin/users?status=inactive');
        $responseInactive->assertOk();
        $this->assertCount(1, $responseInactive->json('data'));
        $this->assertFalse($responseInactive->json('data.0.is_active'));
    }
}
