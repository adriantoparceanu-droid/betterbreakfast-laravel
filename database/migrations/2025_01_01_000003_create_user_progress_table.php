<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->integer('current_day')->default(1);
            $table->json('completed_days')->default('[]');
            $table->json('selected_recipes')->default('{}');
            $table->json('used_recipe_ids')->default('[]');
            $table->json('check_ins')->default('{}');
            $table->json('pantry_checked')->default('[]');
            $table->integer('default_servings')->default(1);
            $table->json('foundation_checked')->default('[]');
            $table->boolean('foundation_done')->default(false);
            $table->boolean('force_reset')->default(false);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_progress');
    }
};
