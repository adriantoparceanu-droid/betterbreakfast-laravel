<?php

namespace Database\Seeders;

use App\Models\MasterIngredient;
use Illuminate\Database\Seeder;

class MasterIngredientMissingSeeder extends Seeder
{
    public function run(): void
    {
        // Ingredients used in module-breakfast-10day recipes that were missing from master_ingredients
        // Names match exactly what's in the recipe ingredients JSON on live
        $ingredients = [
            ['Edamame',                                    'Proteins',           122,  10.9, 5.2,  9.9,  5.2],
            ['Mixed greens (lettuce, arugula, radicchio)', 'Vegetables',         20,   1.8,  0.3,  3.7,  2.0],
            ['Cucumber',                                   'Vegetables',         16,   0.7,  0.1,  3.6,  0.5],
            ['Cucumbers',                                  'Vegetables',         16,   0.7,  0.1,  3.6,  0.5],
            ['Green onions',                               'Vegetables',         32,   1.8,  0.2,  7.3,  2.6],
            ['Parsley',                                    'Vegetables',         36,   3.0,  0.8,  6.3,  3.3],
            ['Avocado',                                    'Fruits',             160,  2.0,  14.7, 8.5,  6.7],
            ['Black pepper',                               'Condiments',         251,  10.4, 3.3,  63.7, 25.3],
            ['Mushrooms',                                  'Vegetables',         22,   3.1,  0.3,  3.3,  1.0],
            ['Dill',                                       'Vegetables',         43,   3.5,  1.1,  7.0,  2.1],
            ['Quinoa',                                     'Grains & Legumes',   120,  4.4,  1.9,  21.3, 2.8],
            ['Chicken breast',                             'Proteins',           165,  31.0, 3.6,  0.0,  0.0],
            ['Chickpeas',                                  'Grains & Legumes',   164,  8.9,  2.6,  27.4, 7.6],
            ['Parmesan cheese',                            'Dairy',              431,  38.5, 29.0, 3.2,  0.0],
            ['Mint',                                       'Vegetables',         70,   3.7,  0.9,  14.9, 8.0],
            ['Pomegranate seeds',                          'Fruits',             83,   1.7,  1.2,  18.7, 4.0],
            ['Paprika',                                    'Condiments',         282,  14.1, 12.9, 54.0, 34.9],
            ['Halloumi',                                   'Dairy',              321,  21.0, 26.0, 0.5,  0.0],
            ['Hemp seeds',                                 'Fats, Nuts & Seeds', 553,  31.6, 48.7, 8.7,  4.0],
            ['Baking soda',                                'Condiments',         0,    0.0,  0.0,  0.0,  0.0],
            ['Sardines, canned',                           'Proteins',           208,  24.6, 11.5, 0.0,  0.0],
            ['Arugula',                                    'Vegetables',         25,   2.6,  0.7,  3.7,  1.6],
            ['Flaxmeal',                                   'Fats, Nuts & Seeds', 534,  18.3, 42.2, 28.9, 27.3],
            ['Bell peppers',                               'Vegetables',         31,   1.0,  0.3,  6.0,  2.1],
            ['Cinnamon, ground',                           'Condiments',         247,  4.0,  1.2,  80.6, 53.1],
            ['Protein powder (whey)',                      'Proteins',           400,  80.0, 7.0,  8.0,  0.0],
            ['Olives',                                     'Fats, Nuts & Seeds', 115,  0.8,  10.9, 6.3,  3.2],
        ];

        $added   = 0;
        $skipped = 0;

        foreach ($ingredients as [$name, $cat, $cal, $prot, $fat, $carbs, $fiber]) {
            if (MasterIngredient::where('name', $name)->exists()) {
                $skipped++;
                continue;
            }

            MasterIngredient::create([
                'name'              => $name,
                'category'          => $cat,
                'calories_per_100g' => $cal,
                'protein_per_100g'  => $prot,
                'fat_per_100g'      => $fat,
                'carbs_per_100g'    => $carbs,
                'fiber_per_100g'    => $fiber,
            ]);
            $added++;
        }

        $this->command->info("Missing ingredients seeder: {$added} added, {$skipped} already existed.");
    }
}
