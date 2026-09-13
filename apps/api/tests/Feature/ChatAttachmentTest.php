<?php

namespace Tests\Feature;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\ConversationStatus;
use App\Enums\MessageType;
use App\Enums\UserRole;
use App\Models\AgentProfile;
use App\Models\AgentStatus;
use App\Models\Conversation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ChatAttachmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $member;
    protected User $agent;
    protected Conversation $conversation;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
        Storage::fake('public');

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

        $this->conversation = Conversation::create([
            'member_id' => $this->member->id,
            'agent_id' => $this->agent->id,
            'status' => ConversationStatus::ACTIVE,
            'started_at' => now(),
            'assigned_at' => now(),
        ]);
    }

    public function test_can_send_valid_photo_under_1mb(): void
    {
        // 500 KB valid image
        $photo = UploadedFile::fake()->image('photo.jpg', 600, 600)->size(500);

        $response = $this->actingAs($this->member, 'sanctum')
            ->post("/api/v1/conversations/{$this->conversation->id}/messages", [
                'content' => 'Ini foto kendala saya',
                'attachments' => [$photo],
            ]);

        $response->assertStatus(201);
        $this->assertEquals(MessageType::IMAGE->value, $response->json('data.type'));
        $this->assertCount(1, $response->json('data.attachments'));
    }

    public function test_photo_exceeding_1mb_is_rejected(): void
    {
        // 1500 KB image (> 1MB)
        $oversizedPhoto = UploadedFile::fake()->image('big_photo.jpg', 1200, 1200)->size(1500);

        $response = $this->actingAs($this->member, 'sanctum')
            ->postJson("/api/v1/conversations/{$this->conversation->id}/messages", [
                'content' => 'Foto besar',
                'attachments' => [$oversizedPhoto],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['attachments.0']);
    }

    public function test_can_send_valid_video_under_50mb(): void
    {
        // 10 MB video
        $video = UploadedFile::fake()->create('screen_recording.mp4', 10240, 'video/mp4');

        $response = $this->actingAs($this->member, 'sanctum')
            ->post("/api/v1/conversations/{$this->conversation->id}/messages", [
                'content' => 'Ini video rekaman kendala ONT',
                'attachments' => [$video],
            ]);

        $response->assertStatus(201);
        $this->assertEquals(MessageType::VIDEO->value, $response->json('data.type'));
        $this->assertCount(1, $response->json('data.attachments'));
    }

    public function test_video_exceeding_50mb_is_rejected(): void
    {
        // 55 MB video (> 50MB)
        $oversizedVideo = UploadedFile::fake()->create('huge_video.mp4', 56320, 'video/mp4');

        $response = $this->actingAs($this->member, 'sanctum')
            ->postJson("/api/v1/conversations/{$this->conversation->id}/messages", [
                'content' => 'Video besar',
                'attachments' => [$oversizedVideo],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['attachments.0']);
    }

    public function test_dangerous_double_extension_is_blocked(): void
    {
        $malicious = UploadedFile::fake()->create('malicious.php.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->member, 'sanctum')
            ->postJson("/api/v1/conversations/{$this->conversation->id}/messages", [
                'attachments' => [$malicious],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['attachments.0']);
    }

    public function test_svg_file_is_blocked_for_xss_protection(): void
    {
        $svg = UploadedFile::fake()->create('vector.svg', 100, 'image/svg+xml');

        $response = $this->actingAs($this->member, 'sanctum')
            ->postJson("/api/v1/conversations/{$this->conversation->id}/messages", [
                'attachments' => [$svg],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['attachments.0']);
    }

    public function test_fake_image_polyglot_rejected_by_decodability_check(): void
    {
        // Plain text content disguised as .png
        $fakePng = UploadedFile::fake()->createWithContent('exploit.png', '<?php phpinfo(); ?>');

        $response = $this->actingAs($this->member, 'sanctum')
            ->postJson("/api/v1/conversations/{$this->conversation->id}/messages", [
                'attachments' => [$fakePng],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['attachments.0']);
    }
}
