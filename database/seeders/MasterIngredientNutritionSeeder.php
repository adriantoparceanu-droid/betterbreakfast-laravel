<?php

namespace Database\Seeders;

use App\Models\MasterIngredient;
use Illuminate\Database\Seeder;

class MasterIngredientNutritionSeeder extends Seeder
{
    public function run(): void
    {
        $populated = MasterIngredient::whereNotNull('calories_per_100g')->count();
        $total     = MasterIngredient::count();

        if ($total > 0 && $populated >= (int) ($total * 0.7)) {
            $this->command->info("Nutrition data already populated ({$populated}/{$total}), skipping.");
            return;
        }

        // [calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g]
        // Names match exactly what's in the live master_ingredients table
        $data = [
            'Arugula'                                    => [25,   2.6,  0.7,   3.7,  1.6],
            'Avocado'                                    => [160,  2.0,  14.7,  8.5,  6.7],
            'Baking soda'                                => [0,    0.0,  0.0,   0.0,  0.0],
            'Banana'                                     => [89,   1.1,  0.3,   23.0, 2.6],
            'Bell peppers'                               => [31,   1.0,  0.3,   6.0,  2.1],
            'Black pepper'                               => [251,  10.4, 3.3,   63.7, 25.3],
            'Blueberries'                                => [57,   0.7,  0.3,   14.5, 2.4],
            'Capers'                                     => [23,   2.4,  0.9,   4.9,  3.2],
            'Cherry tomatoes'                            => [18,   0.9,  0.2,   3.9,  1.2],
            'Chicken breast, cooked'                     => [165,  31.0, 3.6,   0.0,  0.0],
            'Chickpeas'                                  => [164,  8.9,  2.6,   27.4, 7.6],  // canned/cooked
            'Chilli crisp sauce'                         => [120,  2.0,  12.0,  4.0,  1.0],
            'Cinnamon, ground'                           => [247,  4.0,  1.2,   80.6, 53.1],
            'Cottage cheese'                             => [95,   10.9, 4.2,   3.0,  0.1],
            'Cucumbers'                                  => [16,   0.7,  0.1,   3.6,  0.5],
            'Dill'                                       => [43,   3.5,  1.1,   7.0,  2.1],
            'Edamame'                                    => [122,  10.9, 5.2,   9.9,  5.2],
            'Egg whites'                                 => [52,   10.9, 0.2,   0.7,  0.0],
            'Eggs'                                       => [143,  13.0, 9.5,   0.7,  0.0],
            'Feta cheese'                                => [265,  14.2, 21.5,  3.9,  0.0],
            'Flaxmeal'                                   => [534,  18.3, 42.2,  28.9, 27.3],
            'Greek yogurt'                               => [59,   10.2, 0.4,   3.6,  0.0],  // plain, nonfat
            'Green onions'                               => [32,   1.8,  0.2,   7.3,  2.6],
            'Halloumi'                                   => [321,  21.0, 26.0,  0.5,  0.0],
            'Hemp seeds'                                 => [553,  31.6, 48.7,  8.7,  4.0],
            'Kiwi'                                       => [61,   1.1,  0.5,   15.0, 3.0],
            'Lemon, juiced'                              => [22,   0.4,  0.2,   6.9,  0.3],
            'Milk'                                       => [61,   3.2,  3.3,   4.8,  0.0],
            'Mint'                                       => [70,   3.7,  0.9,   14.9, 8.0],
            'Mixed berries'                              => [50,   0.7,  0.3,   12.0, 2.0],
            'Mixed greens (lettuce, arugula, radicchio)' => [20,   1.8,  0.3,   3.7,  2.0],
            'Mushrooms'                                  => [22,   3.1,  0.3,   3.3,  1.0],
            'Mustard'                                    => [66,   4.4,  3.7,   5.8,  3.2],
            'Olive oil'                                  => [884,  0.0,  100.0, 0.0,  0.0],
            'Olives'                                     => [115,  0.8,  10.9,  6.3,  3.2],
            'Oregano'                                    => [265,  9.0,  4.3,   68.9, 42.5],
            'Paprika'                                    => [282,  14.1, 12.9,  54.0, 34.9],
            'Parmesan cheese'                            => [431,  38.5, 29.0,  3.2,  0.0],
            'Parsley'                                    => [36,   3.0,  0.8,   6.3,  3.3],
            'Pomegranate seeds'                          => [83,   1.7,  1.2,   18.7, 4.0],
            'Protein powder (whey)'                      => [400,  80.0, 7.0,   8.0,  0.0],
            'Pumpkin seeds'                              => [559,  30.2, 49.1,  10.7, 6.0],
            'Quinoa, cooked'                             => [120,  4.4,  1.9,   21.3, 2.8],
            'Raspberries'                                => [52,   1.2,  0.7,   11.9, 6.5],
            'Rolled oats'                                => [389,  17.0, 7.0,   66.0, 10.6],
            'Salt'                                       => [0,    0.0,  0.0,   0.0,  0.0],
            'Sardines, canned'                           => [208,  24.6, 11.5,  0.0,  0.0],
            'Smoked salmon'                              => [117,  18.3, 4.3,   0.0,  0.0],
            'Spinach'                                    => [23,   2.9,  0.4,   3.6,  2.2],
            'Tofu'                                       => [76,   8.0,  4.2,   2.0,  0.3],
            'Tuna, canned'                               => [109,  25.5, 0.5,   0.0,  0.0],  // in water
            'Turkey mince'                               => [149,  19.6, 7.4,   0.0,  0.0],
            'Zucchini'                                   => [17,   1.2,  0.3,   3.1,  1.0],
        ];

        $updated = 0;
        $skipped = 0;

        foreach ($data as $name => [$cal, $prot, $fat, $carbs, $fiber]) {
            $rows = MasterIngredient::where('name', $name)->update([
                'calories_per_100g' => $cal,
                'protein_per_100g'  => $prot,
                'fat_per_100g'      => $fat,
                'carbs_per_100g'    => $carbs,
                'fiber_per_100g'    => $fiber,
            ]);

            if ($rows > 0) {
                $updated++;
            } else {
                $skipped++;
                $this->command->warn("  Not found in DB: {$name}");
            }
        }

        $this->command->info("Nutrition seeder done: {$updated} updated, {$skipped} not found in DB.");
    }
}
