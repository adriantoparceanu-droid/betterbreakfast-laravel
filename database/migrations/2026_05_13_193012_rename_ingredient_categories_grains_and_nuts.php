<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rename ingredient categories in master_ingredients
        DB::table('master_ingredients')->where('category', 'Grains')->update(['category' => 'Grains & Legumes']);
        DB::table('master_ingredients')->where('category', 'Seeds & Nuts')->update(['category' => 'Fats, Nuts & Seeds']);

        // Rename ingredient categories embedded in recipes.ingredients JSON
        foreach (DB::table('recipes')->get(['id', 'ingredients']) as $recipe) {
            $ingredients = json_decode($recipe->ingredients, true);
            if (!is_array($ingredients)) continue;

            $changed = false;
            foreach ($ingredients as &$ing) {
                if (($ing['category'] ?? null) === 'Grains') {
                    $ing['category'] = 'Grains & Legumes';
                    $changed = true;
                } elseif (($ing['category'] ?? null) === 'Seeds & Nuts') {
                    $ing['category'] = 'Fats, Nuts & Seeds';
                    $changed = true;
                }
            }
            unset($ing);

            if ($changed) {
                DB::table('recipes')->where('id', $recipe->id)->update(['ingredients' => json_encode($ingredients)]);
            }
        }
    }

    public function down(): void
    {
        DB::table('master_ingredients')->where('category', 'Grains & Legumes')->update(['category' => 'Grains']);
        DB::table('master_ingredients')->where('category', 'Fats, Nuts & Seeds')->update(['category' => 'Seeds & Nuts']);

        foreach (DB::table('recipes')->get(['id', 'ingredients']) as $recipe) {
            $ingredients = json_decode($recipe->ingredients, true);
            if (!is_array($ingredients)) continue;

            $changed = false;
            foreach ($ingredients as &$ing) {
                if (($ing['category'] ?? null) === 'Grains & Legumes') {
                    $ing['category'] = 'Grains';
                    $changed = true;
                } elseif (($ing['category'] ?? null) === 'Fats, Nuts & Seeds') {
                    $ing['category'] = 'Seeds & Nuts';
                    $changed = true;
                }
            }
            unset($ing);

            if ($changed) {
                DB::table('recipes')->where('id', $recipe->id)->update(['ingredients' => json_encode($ingredients)]);
            }
        }
    }
};
