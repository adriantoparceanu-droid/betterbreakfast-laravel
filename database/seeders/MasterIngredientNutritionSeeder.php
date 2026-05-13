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
        // Sources: USDA FoodData Central (Foundation / SR Legacy) + manual correction where API matched wrong product
        $data = [
            'Almond butter'         => [614,   21.0,  56.0,   19.0,  10.0],
            'Almond milk'           => [15,    0.4,   1.1,    0.5,   0.3],   // unsweetened, carton
            'Almonds'               => [579,   21.2,  50.0,   21.6,  12.5],
            'Baby spinach'          => [23,    2.9,   0.4,    3.6,   2.2],
            'Baking powder'         => [97,    0.1,   0.4,    46.9,  2.2],
            'Banana'                => [89,    1.1,   0.3,    23.0,  2.6],
            'Banana (sliced)'       => [89,    1.1,   0.3,    23.0,  2.6],
            'Bell pepper'           => [31,    1.0,   0.3,    6.0,   2.1],
            'Black beans'           => [341,   21.6,  1.4,    62.4,  15.5],
            'Blueberries'           => [57,    0.7,   0.3,    14.5,  2.4],
            'Capers'                => [23,    2.4,   0.9,    4.9,   3.2],
            'Cardamom'              => [311,   10.8,  6.7,    68.5,  28.0],
            'Cheddar cheese'        => [408,   23.3,  34.0,   2.4,   0.0],
            'Cherry tomatoes'       => [18,    0.9,   0.2,    3.9,   1.2],
            'Chia seeds'            => [486,   16.5,  30.7,   42.1,  34.4],
            'Cinnamon'              => [247,   4.0,   1.2,    80.6,  53.1],  // spice
            'Coconut flakes'        => [443,   3.4,   31.7,   40.9,  4.5],
            'Coconut milk'          => [197,   2.0,   21.0,   2.8,   0.0],   // canned full-fat
            'Cottage cheese'        => [95,    10.9,  4.2,    3.0,   0.1],
            'Cream cheese'          => [350,   6.2,   34.4,   5.5,   0.0],
            'Dark chocolate'        => [556,   5.5,   32.4,   60.5,  6.5],
            'Egg'                   => [143,   13.0,  9.5,    0.7,   0.0],   // whole raw egg
            'Eggs'                  => [143,   13.0,  9.5,    0.7,   0.0],
            'Feta cheese'           => [265,   14.2,  21.5,   3.9,   0.0],
            'Firm tofu'             => [85,    10.9,  4.2,    1.0,   0.9],
            'Frozen açaí packets'   => [70,    1.5,   5.0,    4.0,   2.0],   // unsweetened açaí pulp
            'Frozen banana'         => [89,    1.1,   0.3,    23.0,  2.6],
            'Garlic powder'         => [331,   16.6,  0.7,    72.7,  9.0],
            'Granola'               => [489,   13.7,  24.3,   53.9,  8.9],
            'Greek yogurt'          => [59,    10.2,  0.4,    3.6,   0.0],   // plain, nonfat
            'Honey'                 => [304,   0.3,   0.0,    82.4,  0.2],
            'Kiwi'                  => [61,    1.1,   0.5,    15.0,  3.0],
            'Lemon juice'           => [22,    0.4,   0.2,    6.9,   0.3],
            'Lime juice'            => [25,    0.4,   0.1,    8.4,   0.4],
            'Mango chunks'          => [60,    0.8,   0.4,    15.0,  1.6],
            'Mango chunks (frozen)' => [60,    0.8,   0.4,    15.0,  1.6],
            'Maple syrup'           => [260,   0.0,   0.1,    67.0,  0.0],
            'Milk'                  => [61,    3.2,   3.3,    4.8,   0.0],   // whole milk
            'Mixed berries'         => [50,    0.7,   0.3,    12.0,  2.0],
            'Oat milk'              => [48,    1.3,   1.5,    7.8,   0.8],
            'Oats'                  => [389,   17.0,  7.0,    66.0,  10.6],
            'Olive oil'             => [884,   0.0,   100.0,  0.0,   0.0],
            'Peanut butter'         => [588,   25.0,  50.0,   20.0,  6.0],
            'Red onion'             => [44,    0.9,   0.1,    9.9,   2.2],
            'Red pepper flakes'     => [282,   12.1,  14.9,   49.7,  27.2],  // dried chili flakes
            'Rice cakes'            => [392,   7.1,   4.3,    81.1,  4.2],
            'Ripe avocado'          => [160,   2.0,   14.7,   8.5,   6.7],
            'Rolled oats'           => [389,   17.0,  7.0,    66.0,  10.6],
            'Salt'                  => [0,     0.0,   0.0,    0.0,   0.0],
            'Salt and pepper'       => [0,     0.0,   0.0,    0.0,   0.0],
            'Smoked paprika'        => [282,   14.1,  12.9,   54.0,  34.9],
            'Smoked salmon'         => [117,   18.3,  4.3,    0.0,   0.0],
            'Sourdough bread'       => [272,   10.8,  2.4,    51.9,  2.2],
            'Spinach'               => [23,    2.9,   0.4,    3.6,   2.2],
            'Strawberries'          => [32,    0.7,   0.3,    7.7,   2.0],
            'Toasted coconut'       => [592,   5.3,   47.0,   44.4,  9.0],
            'Turmeric'              => [312,   9.7,   3.3,    67.1,  22.7],
            'Vanilla extract'       => [288,   0.1,   0.1,    12.6,  0.0],
            'Whole grain bagel'     => [255,   9.3,   2.0,    54.5,  4.7],
            'Whole grain bread'     => [265,   13.4,  4.2,    43.3,  7.4],
            'Whole wheat flour'     => [370,   15.1,  2.7,    71.2,  10.6],
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
