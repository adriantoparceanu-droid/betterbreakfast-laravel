<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('anonymous_id');
            $table->string('event');
            $table->json('properties')->default('{}');
            $table->boolean('synced')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->index('anonymous_id');
            $table->index('synced');
            $table->index('event');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
