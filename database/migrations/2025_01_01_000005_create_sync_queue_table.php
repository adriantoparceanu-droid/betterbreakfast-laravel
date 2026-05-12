<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->json('payload')->default('{}');
            $table->boolean('synced')->default(false);
            $table->integer('retries')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'synced']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_queue');
    }
};
