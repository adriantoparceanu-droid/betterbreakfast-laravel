<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('master_ingredients', function (Blueprint $table) {
            $table->decimal('calories_per_100g', 8, 2)->nullable()->after('category');
            $table->decimal('protein_per_100g',  8, 2)->nullable()->after('calories_per_100g');
            $table->decimal('fat_per_100g',      8, 2)->nullable()->after('protein_per_100g');
            $table->decimal('carbs_per_100g',    8, 2)->nullable()->after('fat_per_100g');
            $table->decimal('fiber_per_100g',    8, 2)->nullable()->after('carbs_per_100g');
        });
    }

    public function down(): void
    {
        Schema::table('master_ingredients', function (Blueprint $table) {
            $table->dropColumn(['calories_per_100g', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g', 'fiber_per_100g']);
        });
    }
};
