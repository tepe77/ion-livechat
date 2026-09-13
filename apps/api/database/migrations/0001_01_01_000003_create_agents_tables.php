<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('max_concurrent_conversations')->default(5);
            $table->timestamps();
        });

        Schema::create('agent_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('presence')->default('offline'); // online, offline
            $table->string('availability')->default('available'); // available, away, busy
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('available_since')->nullable();
            $table->timestamps();

            $table->index(['presence', 'availability']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_statuses');
        Schema::dropIfExists('agent_profiles');
    }
};
