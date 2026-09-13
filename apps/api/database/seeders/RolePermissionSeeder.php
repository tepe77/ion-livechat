<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Roles
        $roles = [
            UserRole::SUPERADMIN->value => 'Superadmin',
            UserRole::MANAGER->value => 'Manager / SPV',
            UserRole::AGENT->value => 'Customer Service Agent',
            UserRole::MEMBER->value => 'Member / Customer',
        ];

        $roleModels = [];
        foreach ($roles as $slug => $name) {
            $roleModels[$slug] = Role::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name]
            );
        }

        // 2. Create Permissions
        $permissions = [
            'conversation.view' => 'View Conversations',
            'conversation.create' => 'Create Conversation',
            'conversation.reply' => 'Send Message',
            'conversation.close' => 'Close Conversation',
            'conversation.transfer' => 'Transfer Conversation',
            'agent.view' => 'View Agents',
            'agent.create' => 'Create Agent',
            'agent.update' => 'Update Agent',
            'agent.manage' => 'Manage Agents',
            'performance.view' => 'View Performance Metrics',
            'rating.view' => 'View Ratings',
            'rating.create' => 'Submit Rating',
            'user.manage' => 'Manage Users',
            'system.manage' => 'Manage System',
            'audit.view' => 'View Audit Logs',
        ];

        $permissionModels = [];
        foreach ($permissions as $slug => $name) {
            $permissionModels[$slug] = Permission::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name]
            );
        }

        // 3. Assign Permissions
        // Superadmin: everything
        $roleModels[UserRole::SUPERADMIN->value]->permissions()->sync(
            collect($permissionModels)->pluck('id')->toArray()
        );

        // Manager: operational & monitoring
        $managerPerms = [
            'conversation.view',
            'conversation.close',
            'conversation.transfer',
            'agent.view',
            'agent.create',
            'agent.update',
            'agent.manage',
            'performance.view',
            'rating.view',
            'audit.view',
        ];
        $roleModels[UserRole::MANAGER->value]->permissions()->sync(
            collect($managerPerms)->map(fn ($slug) => $permissionModels[$slug]->id)->toArray()
        );

        // Agent: workspace & active conversations
        $agentPerms = [
            'conversation.view',
            'conversation.reply',
            'conversation.close',
            'conversation.transfer',
            'performance.view',
        ];
        $roleModels[UserRole::AGENT->value]->permissions()->sync(
            collect($agentPerms)->map(fn ($slug) => $permissionModels[$slug]->id)->toArray()
        );

        // Member: own conversations & rating
        $memberPerms = [
            'conversation.view',
            'conversation.create',
            'conversation.reply',
            'rating.create',
        ];
        $roleModels[UserRole::MEMBER->value]->permissions()->sync(
            collect($memberPerms)->map(fn ($slug) => $permissionModels[$slug]->id)->toArray()
        );
    }
}
