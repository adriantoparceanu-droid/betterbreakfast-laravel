<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('image')->default('');
            $table->integer('base_servings');
            $table->json('ingredients');
            $table->json('steps');
            $table->json('nutrition');
            $table->json('tags')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->string('module_id')->nullable();
            $table->foreign('module_id')->references('id')->on('modules')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};
