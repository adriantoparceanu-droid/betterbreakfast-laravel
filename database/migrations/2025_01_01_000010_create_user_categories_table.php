<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_categories', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category_id');
            $table->foreign('category_id')->references('id')->on('recipe_categories')->cascadeOnDelete();
            $table->timestamp('purchased_at')->useCurrent();
            $table->primary(['user_id', 'category_id']);
            $table->index('user_id');
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_categories');
    }
};
