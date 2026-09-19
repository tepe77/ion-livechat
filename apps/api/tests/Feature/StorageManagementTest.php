<?php

namespace Tests\Feature;

use App\Enums\ConversationStatus;
use App\Models\AuditLog;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $superadmin;
    protected User $agent;
    protected User $member;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $superadminRole = Role::firstOrCreate(['slug' => 'superadmin'], ['name' => 'Superadmin']);
        $agentRole = Role::firstOrCreate(['slug' => 'agent'], ['name' => 'Agent']);
        $memberRole = Role::firstOrCreate(['slug' => 'member'], ['name' => 'Member']);

        $this->superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $this->agent = User::factory()->create(['role_id' => $agentRole->id]);
        $this->member = User::factory()->create(['role_id' => $memberRole->id]);
    }

    public function test_only_superadmin_can_access_storage_metrics(): void
    {
        // Unauthenticated
        $this->getJson('/api/v1/admin/storage/metrics')
            ->assertStatus(401);

        // Member
        $this->actingAs($this->member, 'sanctum')
            ->getJson('/api/v1/admin/storage/metrics')
            ->assertStatus(403);

        // Agent
        $this->actingAs($this->agent, 'sanctum')
            ->getJson('/api/v1/admin/storage/metrics')
            ->assertStatus(403);

        // Superadmin
        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson('/api/v1/admin/storage/metrics')
            ->assertStatus(200);

        $response->assertJsonStructure([
            'data' => [
                'disk' => ['total_bytes', 'total_formatted', 'free_bytes', 'free_formatted', 'used_bytes', 'used_formatted', 'used_percent'],
                'attachments' => ['disk_bytes', 'disk_formatted', 'total_files', 'db_records'],
                'database' => ['size_bytes', 'size_formatted', 'audit_logs_count', 'conversations_count', 'closed_conversations_count', 'messages_count'],
                'retention' => ['retention_audit_logs_days', 'retention_attachments_days', 'auto_prune_enabled', 'last_pruned_at'],
            ],
        ]);
    }

    public function test_superadmin_can_update_storage_retention_settings(): void
    {
        $payload = [
            'retention_audit_logs_days' => 120,
            'retention_attachments_days' => 45,
            'auto_prune_enabled' => false,
        ];

        $this->actingAs($this->superadmin, 'sanctum')
            ->putJson('/api/v1/admin/storage/settings', $payload)
            ->assertStatus(200)
            ->assertJsonPath('data.retention.retention_audit_logs_days', 120)
            ->assertJsonPath('data.retention.retention_attachments_days', 45)
            ->assertJsonPath('data.retention.auto_prune_enabled', false);

        $this->assertEquals('120', Setting::get('retention_audit_logs_days'));
        $this->assertEquals('45', Setting::get('retention_attachments_days'));
        $this->assertEquals('0', Setting::get('auto_prune_enabled'));
    }

    public function test_pruning_removes_old_audit_logs(): void
    {
        // Create an old audit log (> 90 days)
        $oldLog = AuditLog::create([
            'actor_id' => $this->superadmin->id,
            'action' => 'old.action',
            'created_at' => now()->subDays(100),
        ]);

        // Create a recent audit log
        $recentLog = AuditLog::create([
            'actor_id' => $this->superadmin->id,
            'action' => 'recent.action',
            'created_at' => now()->subDays(10),
        ]);

        $this->actingAs($this->superadmin, 'sanctum')
            ->postJson('/api/v1/admin/storage/prune', [
                'prune_audit_logs' => true,
                'prune_attachments' => false,
                'clean_orphans' => false,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.deleted_audit_logs_count', 1);

        $this->assertDatabaseMissing('audit_logs', ['id' => $oldLog->id]);
        $this->assertDatabaseHas('audit_logs', ['id' => $recentLog->id]);
    }

    public function test_pruning_removes_old_closed_conversation_attachments(): void
    {
        // 1. Closed conversation 70 days ago (older than default 60 days)
        $oldClosedConv = Conversation::create([
            'member_id' => $this->member->id,
            'agent_id' => $this->agent->id,
            'status' => ConversationStatus::CLOSED,
            'started_at' => now()->subDays(71),
            'closed_at' => now()->subDays(70),
        ]);

        $oldMsg = Message::create([
            'conversation_id' => $oldClosedConv->id,
            'sender_id' => $this->member->id,
            'content' => '',
            'type' => 'image',
        ]);

        $oldFile = UploadedFile::fake()->image('old_photo.jpg');
        $oldPath = $oldFile->store('attachments/' . $oldClosedConv->id, 'public');

        $oldAtt = MessageAttachment::create([
            'message_id' => $oldMsg->id,
            'disk' => 'public',
            'path' => $oldPath,
            'original_name' => 'old_photo.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 10240,
        ]);

        Storage::disk('public')->assertExists($oldPath);

        // 2. Active conversation with attachment (should NOT be pruned)
        $activeConv = Conversation::create([
            'member_id' => $this->member->id,
            'agent_id' => $this->agent->id,
            'status' => ConversationStatus::ACTIVE,
            'started_at' => now()->subDays(5),
        ]);

        $activeMsg = Message::create([
            'conversation_id' => $activeConv->id,
            'sender_id' => $this->member->id,
            'content' => 'Active chat',
            'type' => 'image',
        ]);

        $activeFile = UploadedFile::fake()->image('active_photo.jpg');
        $activePath = $activeFile->store('attachments/' . $activeConv->id, 'public');

        $activeAtt = MessageAttachment::create([
            'message_id' => $activeMsg->id,
            'disk' => 'public',
            'path' => $activePath,
            'original_name' => 'active_photo.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 10240,
        ]);

        // Run prune
        $this->actingAs($this->superadmin, 'sanctum')
            ->postJson('/api/v1/admin/storage/prune', [
                'prune_audit_logs' => false,
                'prune_attachments' => true,
                'clean_orphans' => false,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.deleted_attachments_count', 1);

        // Old attachment is removed from DB and disk
        $this->assertDatabaseMissing('message_attachments', ['id' => $oldAtt->id]);
        Storage::disk('public')->assertMissing($oldPath);

        // Message has placeholder noting retention expiration
        $oldMsg->refresh();
        $this->assertStringContainsString('kedaluwarsa sesuai kebijakan retensi', $oldMsg->content);

        // Active attachment remains intact
        $this->assertDatabaseHas('message_attachments', ['id' => $activeAtt->id]);
        Storage::disk('public')->assertExists($activePath);
    }

    public function test_orphan_files_cleaned_from_disk(): void
    {
        // Store an orphan file without DB record
        $orphanFile = UploadedFile::fake()->image('orphan.png');
        $orphanPath = $orphanFile->store('attachments/999', 'public');
        Storage::disk('public')->assertExists($orphanPath);

        $this->actingAs($this->superadmin, 'sanctum')
            ->postJson('/api/v1/admin/storage/prune', [
                'prune_audit_logs' => false,
                'prune_attachments' => false,
                'clean_orphans' => true,
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.deleted_orphan_files_count', 1);

        Storage::disk('public')->assertMissing($orphanPath);
    }

    public function test_artisan_storage_prune_command(): void
    {
        $this->artisan('ion:storage-prune', ['--dry-run' => true])
            ->assertSuccessful();
    }
}
