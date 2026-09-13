<?php

namespace Database\Seeders;

use App\Enums\AgentAvailability;
use App\Enums\AgentPresence;
use App\Enums\AssignmentReason;
use App\Enums\ConversationStatus;
use App\Enums\MessageType;
use App\Enums\UserRole;
use App\Models\AgentProfile;
use App\Models\AgentStatus;
use App\Models\Conversation;
use App\Models\ConversationAssignment;
use App\Models\ConversationRating;
use App\Models\Message;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superadminRole = Role::where('slug', UserRole::SUPERADMIN->value)->firstOrFail();
        $managerRole = Role::where('slug', UserRole::MANAGER->value)->firstOrFail();
        $agentRole = Role::where('slug', UserRole::AGENT->value)->firstOrFail();
        $memberRole = Role::where('slug', UserRole::MEMBER->value)->firstOrFail();

        $password = Hash::make('password');

        // 1. Superadmin
        $admin = User::firstOrCreate(
            ['email' => 'admin@ion.test'],
            [
                'name' => 'System Administrator',
                'password' => $password,
                'role_id' => $superadminRole->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Manager
        $manager = User::firstOrCreate(
            ['email' => 'manager@ion.test'],
            [
                'name' => 'Operational Manager',
                'password' => $password,
                'role_id' => $managerRole->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 3. Agents
        $agent1 = User::firstOrCreate(
            ['email' => 'agent1@ion.test'],
            [
                'name' => 'Sarah Customer Care',
                'password' => $password,
                'role_id' => $agentRole->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        AgentProfile::firstOrCreate(
            ['user_id' => $agent1->id],
            ['max_concurrent_conversations' => 5]
        );
        AgentStatus::firstOrCreate(
            ['agent_id' => $agent1->id],
            [
                'presence' => AgentPresence::OFFLINE,
                'availability' => AgentAvailability::AVAILABLE,
                'last_seen_at' => null,
                'available_since' => null,
            ]
        );

        $agent2 = User::firstOrCreate(
            ['email' => 'agent2@ion.test'],
            [
                'name' => 'Alex Technical Support',
                'password' => $password,
                'role_id' => $agentRole->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        AgentProfile::firstOrCreate(
            ['user_id' => $agent2->id],
            ['max_concurrent_conversations' => 5]
        );
        AgentStatus::firstOrCreate(
            ['agent_id' => $agent2->id],
            [
                'presence' => AgentPresence::OFFLINE,
                'availability' => AgentAvailability::AVAILABLE,
                'last_seen_at' => null,
                'available_since' => null,
            ]
        );

        // 4. Members
        $member1 = User::firstOrCreate(
            ['email' => 'member1@ion.test'],
            [
                'name' => 'Budi Customer',
                'password' => $password,
                'role_id' => $memberRole->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $member2 = User::firstOrCreate(
            ['email' => 'member2@ion.test'],
            [
                'name' => 'Siti Customer',
                'password' => $password,
                'role_id' => $memberRole->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 5. Seed an active conversation for member1 with agent1
        $conv1 = Conversation::firstOrCreate(
            ['member_id' => $member1->id, 'status' => ConversationStatus::ACTIVE],
            [
                'agent_id' => $agent1->id,
                'started_at' => now()->subMinutes(10),
                'assigned_at' => now()->subMinutes(10),
                'first_response_at' => now()->subMinutes(9),
            ]
        );
        ConversationAssignment::firstOrCreate(
            ['conversation_id' => $conv1->id, 'agent_id' => $agent1->id],
            [
                'assigned_at' => now()->subMinutes(10),
                'reason' => AssignmentReason::AUTO_ROUTING,
            ]
        );
        Message::firstOrCreate(
            ['conversation_id' => $conv1->id, 'content' => 'Halo, koneksi internet saya sedikit lambat hari ini.'],
            [
                'sender_id' => $member1->id,
                'type' => MessageType::TEXT,
                'created_at' => now()->subMinutes(10),
            ]
        );
        Message::firstOrCreate(
            ['conversation_id' => $conv1->id, 'content' => 'Halo Kak Budi, mohon maaf atas ketidaknyamanannya. Boleh bantu sebutkan nomor pelanggan Anda?'],
            [
                'sender_id' => $agent1->id,
                'type' => MessageType::TEXT,
                'created_at' => now()->subMinutes(9),
            ]
        );

        // 6. Seed a closed conversation with rating for member1
        $convClosed = Conversation::firstOrCreate(
            ['member_id' => $member1->id, 'status' => ConversationStatus::CLOSED],
            [
                'agent_id' => $agent2->id,
                'started_at' => now()->subDays(1),
                'assigned_at' => now()->subDays(1),
                'first_response_at' => now()->subDays(1)->addSeconds(45),
                'closed_at' => now()->subDays(1)->addMinutes(15),
            ]
        );
        ConversationAssignment::firstOrCreate(
            ['conversation_id' => $convClosed->id, 'agent_id' => $agent2->id],
            [
                'assigned_at' => now()->subDays(1),
                'unassigned_at' => now()->subDays(1)->addMinutes(15),
                'reason' => AssignmentReason::AUTO_ROUTING,
            ]
        );
        Message::firstOrCreate(
            ['conversation_id' => $convClosed->id, 'content' => 'Bagaimana cara restart modem router ION?'],
            [
                'sender_id' => $member1->id,
                'type' => MessageType::TEXT,
                'created_at' => now()->subDays(1),
            ]
        );
        Message::firstOrCreate(
            ['conversation_id' => $convClosed->id, 'content' => 'Bisa ditekan tombol power di bagian belakang selama 10 detik lalu nyalakan kembali ya kak.'],
            [
                'sender_id' => $agent2->id,
                'type' => MessageType::TEXT,
                'created_at' => now()->subDays(1)->addSeconds(45),
            ]
        );
        ConversationRating::firstOrCreate(
            ['conversation_id' => $convClosed->id],
            [
                'agent_id' => $agent2->id,
                'member_id' => $member1->id,
                'rating' => 5,
                'comment' => 'Penjelasan sangat jelas dan ramah!',
            ]
        );
    }
}
