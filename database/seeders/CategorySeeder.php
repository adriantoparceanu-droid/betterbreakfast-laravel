<?php

namespace Database\Seeders;

use App\Models\RecipeCategory;
use App\Models\Recipe;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'id'          => 'cat-highprotein',
                'module_id'   => 'module-breakfast-premium',
                'name'        => 'High Protein',
                'slug'        => 'high-protein',
                'description' => 'Breakfast recipes packed with protein to fuel your day.',
                'price'       => 4.99,
                'sort_order'  => 1,
                'is_active'   => true,
            ],
            [
                'id'          => 'cat-quickmeals',
                'module_id'   => 'module-breakfast-premium',
                'name'        => 'Quick & Easy',
                'slug'        => 'quick-easy',
                'description' => 'Ready in under 10 minutes — for busy mornings.',
                'price'       => 3.99,
                'sort_order'  => 2,
                'is_active'   => true,
            ],
            [
                'id'          => 'cat-plantbased',
                'module_id'   => 'module-breakfast-premium',
                'name'        => 'Plant-Based',
                'slug'        => 'plant-based',
                'description' => '100% plant-based breakfasts — nourishing and delicious.',
                'price'       => 4.99,
                'sort_order'  => 3,
                'is_active'   => true,
            ],
        ];

        foreach ($categories as $cat) {
            RecipeCategory::updateOrCreate(['id' => $cat['id']], $cat);
        }

        // Sample recipes for each category
        $recipes = [
            // High Protein
            [
                'id'           => 'recipe-p01',
                'name'         => 'Cottage Cheese Power Bowl',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-highprotein',
                'tags'         => ['no-cook', 'high-protein', 'quick'],
                'ingredients'  => [
                    ['name' => 'Cottage cheese',    'quantity' => 200, 'unit' => 'g',    'category' => 'Dairy'],
                    ['name' => 'Almonds',            'quantity' => 20,  'unit' => 'g',    'category' => 'Seeds & Nuts'],
                    ['name' => 'Banana',             'quantity' => 1,   'unit' => 'whole','category' => 'Fruits'],
                    ['name' => 'Honey',              'quantity' => 1,   'unit' => 'tsp',  'category' => 'Condiments'],
                ],
                'steps'        => [
                    'Spoon cottage cheese into a bowl.',
                    'Slice banana and arrange on top.',
                    'Scatter almonds and drizzle with honey.',
                ],
                'nutrition'    => ['calories' => 320, 'protein' => 28, 'fat' => 9, 'carbs' => 30, 'fiber' => 3],
                'sort_order'   => 1,
                'is_active'    => true,
            ],
            [
                'id'           => 'recipe-p02',
                'name'         => 'Smoked Salmon Bagel',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-highprotein',
                'tags'         => ['high-protein', 'no-cook'],
                'ingredients'  => [
                    ['name' => 'Whole grain bagel', 'quantity' => 1,   'unit' => 'whole', 'category' => 'Grains'],
                    ['name' => 'Cream cheese',      'quantity' => 2,   'unit' => 'tbsp',  'category' => 'Dairy'],
                    ['name' => 'Smoked salmon',     'quantity' => 80,  'unit' => 'g',     'category' => 'Proteins'],
                    ['name' => 'Capers',            'quantity' => 1,   'unit' => 'tsp',   'category' => 'Condiments'],
                    ['name' => 'Red onion',         'quantity' => 2,   'unit' => 'slices','category' => 'Vegetables'],
                    ['name' => 'Lemon juice',       'quantity' => 0.5, 'unit' => 'tsp',   'category' => 'Condiments'],
                ],
                'steps'        => [
                    'Toast the bagel halves until golden.',
                    'Spread cream cheese on each half.',
                    'Lay smoked salmon over the cream cheese.',
                    'Top with capers, red onion, and a squeeze of lemon.',
                ],
                'nutrition'    => ['calories' => 390, 'protein' => 30, 'fat' => 14, 'carbs' => 35, 'fiber' => 3],
                'sort_order'   => 2,
                'is_active'    => true,
            ],
            [
                'id'           => 'recipe-p03',
                'name'         => 'Protein Pancakes',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-highprotein',
                'tags'         => ['hot', 'high-protein'],
                'ingredients'  => [
                    ['name' => 'Oats',             'quantity' => 50,  'unit' => 'g',    'category' => 'Grains'],
                    ['name' => 'Eggs',             'quantity' => 2,   'unit' => 'whole','category' => 'Proteins'],
                    ['name' => 'Banana',           'quantity' => 1,   'unit' => 'whole','category' => 'Fruits'],
                    ['name' => 'Greek yogurt',     'quantity' => 50,  'unit' => 'g',    'category' => 'Dairy'],
                    ['name' => 'Baking powder',    'quantity' => 0.5, 'unit' => 'tsp',  'category' => 'Condiments'],
                ],
                'steps'        => [
                    'Blend oats, eggs, banana, yogurt, and baking powder until smooth.',
                    'Heat a non-stick pan over medium heat.',
                    'Pour small rounds and cook until bubbles form, then flip.',
                    'Serve with fruit or a drizzle of honey.',
                ],
                'nutrition'    => ['calories' => 350, 'protein' => 22, 'fat' => 9, 'carbs' => 44, 'fiber' => 5],
                'sort_order'   => 3,
                'is_active'    => true,
            ],

            // Quick & Easy
            [
                'id'           => 'recipe-p04',
                'name'         => 'Peanut Butter Rice Cake Stack',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-quickmeals',
                'tags'         => ['no-cook', 'quick'],
                'ingredients'  => [
                    ['name' => 'Rice cakes',       'quantity' => 3,   'unit' => 'whole','category' => 'Grains'],
                    ['name' => 'Peanut butter',    'quantity' => 2,   'unit' => 'tbsp', 'category' => 'Seeds & Nuts'],
                    ['name' => 'Strawberries',     'quantity' => 5,   'unit' => 'whole','category' => 'Fruits'],
                    ['name' => 'Chia seeds',       'quantity' => 1,   'unit' => 'tsp',  'category' => 'Seeds & Nuts'],
                ],
                'steps'        => [
                    'Spread peanut butter on each rice cake.',
                    'Slice strawberries and place on top.',
                    'Sprinkle with chia seeds and serve.',
                ],
                'nutrition'    => ['calories' => 280, 'protein' => 9, 'fat' => 13, 'carbs' => 33, 'fiber' => 4],
                'sort_order'   => 1,
                'is_active'    => true,
            ],
            [
                'id'           => 'recipe-p05',
                'name'         => 'Instant Mango Lassi Bowl',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-quickmeals',
                'tags'         => ['no-cook', 'quick'],
                'ingredients'  => [
                    ['name' => 'Mango chunks (frozen)', 'quantity' => 150, 'unit' => 'g',    'category' => 'Fruits'],
                    ['name' => 'Greek yogurt',          'quantity' => 150, 'unit' => 'g',    'category' => 'Dairy'],
                    ['name' => 'Honey',                 'quantity' => 1,   'unit' => 'tsp',  'category' => 'Condiments'],
                    ['name' => 'Cardamom',              'quantity' => 0.25,'unit' => 'tsp',  'category' => 'Condiments'],
                    ['name' => 'Granola',               'quantity' => 2,   'unit' => 'tbsp', 'category' => 'Grains'],
                ],
                'steps'        => [
                    'Blend mango, yogurt, honey, and cardamom until smooth.',
                    'Pour into a bowl and top with granola.',
                    'Serve immediately.',
                ],
                'nutrition'    => ['calories' => 290, 'protein' => 14, 'fat' => 3, 'carbs' => 52, 'fiber' => 3],
                'sort_order'   => 2,
                'is_active'    => true,
            ],
            [
                'id'           => 'recipe-p06',
                'name'         => 'Banana Oat Mug Cake',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-quickmeals',
                'tags'         => ['hot', 'quick'],
                'ingredients'  => [
                    ['name' => 'Banana',          'quantity' => 1,   'unit' => 'whole','category' => 'Fruits'],
                    ['name' => 'Rolled oats',     'quantity' => 4,   'unit' => 'tbsp', 'category' => 'Grains'],
                    ['name' => 'Egg',             'quantity' => 1,   'unit' => 'whole','category' => 'Proteins'],
                    ['name' => 'Cinnamon',        'quantity' => 0.5, 'unit' => 'tsp',  'category' => 'Condiments'],
                    ['name' => 'Dark chocolate',  'quantity' => 5,   'unit' => 'g',    'category' => 'Condiments'],
                ],
                'steps'        => [
                    'Mash banana in a microwave-safe mug.',
                    'Add oats, egg, and cinnamon — stir well.',
                    'Press chocolate pieces on top.',
                    'Microwave on high for 90 seconds until set.',
                ],
                'nutrition'    => ['calories' => 260, 'protein' => 10, 'fat' => 6, 'carbs' => 42, 'fiber' => 5],
                'sort_order'   => 3,
                'is_active'    => true,
            ],

            // Plant-Based
            [
                'id'           => 'recipe-p07',
                'name'         => 'Tofu Scramble',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-plantbased',
                'tags'         => ['hot', 'plant-based', 'high-protein'],
                'ingredients'  => [
                    ['name' => 'Firm tofu',      'quantity' => 150, 'unit' => 'g',    'category' => 'Proteins'],
                    ['name' => 'Turmeric',        'quantity' => 0.5, 'unit' => 'tsp',  'category' => 'Condiments'],
                    ['name' => 'Garlic powder',   'quantity' => 0.25,'unit' => 'tsp',  'category' => 'Condiments'],
                    ['name' => 'Bell pepper',     'quantity' => 0.5, 'unit' => 'whole','category' => 'Vegetables'],
                    ['name' => 'Cherry tomatoes', 'quantity' => 5,   'unit' => 'whole','category' => 'Vegetables'],
                    ['name' => 'Olive oil',       'quantity' => 1,   'unit' => 'tsp',  'category' => 'Condiments'],
                ],
                'steps'        => [
                    'Crumble tofu into a hot pan with olive oil.',
                    'Add turmeric and garlic powder, stir to coat.',
                    'Add diced bell pepper and halved tomatoes.',
                    'Cook 5 minutes until tofu is golden and veggies are tender.',
                ],
                'nutrition'    => ['calories' => 220, 'protein' => 18, 'fat' => 12, 'carbs' => 8, 'fiber' => 2],
                'sort_order'   => 1,
                'is_active'    => true,
            ],
            [
                'id'           => 'recipe-p08',
                'name'         => 'Avocado & Black Bean Toast',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-plantbased',
                'tags'         => ['no-cook', 'plant-based', 'high-fiber'],
                'ingredients'  => [
                    ['name' => 'Sourdough bread',   'quantity' => 2,   'unit' => 'slices','category' => 'Grains'],
                    ['name' => 'Ripe avocado',      'quantity' => 1,   'unit' => 'whole', 'category' => 'Fruits'],
                    ['name' => 'Black beans',       'quantity' => 80,  'unit' => 'g',     'category' => 'Proteins'],
                    ['name' => 'Lime juice',        'quantity' => 1,   'unit' => 'tsp',   'category' => 'Condiments'],
                    ['name' => 'Smoked paprika',    'quantity' => 0.25,'unit' => 'tsp',   'category' => 'Condiments'],
                    ['name' => 'Salt',              'quantity' => 1,   'unit' => 'pinch', 'category' => 'Condiments'],
                ],
                'steps'        => [
                    'Toast the bread.',
                    'Mash avocado with lime juice and salt.',
                    'Spread avocado on toast and spoon black beans on top.',
                    'Sprinkle with smoked paprika.',
                ],
                'nutrition'    => ['calories' => 370, 'protein' => 14, 'fat' => 16, 'carbs' => 44, 'fiber' => 12],
                'sort_order'   => 2,
                'is_active'    => true,
            ],
            [
                'id'           => 'recipe-p09',
                'name'         => 'Coconut Oatmeal with Caramelised Banana',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-plantbased',
                'tags'         => ['hot', 'plant-based', 'comfort'],
                'ingredients'  => [
                    ['name' => 'Rolled oats',        'quantity' => 60,  'unit' => 'g',    'category' => 'Grains'],
                    ['name' => 'Coconut milk',       'quantity' => 200, 'unit' => 'ml',   'category' => 'Dairy'],
                    ['name' => 'Banana',             'quantity' => 1,   'unit' => 'whole','category' => 'Fruits'],
                    ['name' => 'Maple syrup',        'quantity' => 1,   'unit' => 'tbsp', 'category' => 'Condiments'],
                    ['name' => 'Toasted coconut',    'quantity' => 1,   'unit' => 'tbsp', 'category' => 'Seeds & Nuts'],
                ],
                'steps'        => [
                    'Cook oats with coconut milk over medium heat, stirring until creamy.',
                    'In a separate pan, slice banana and cook with maple syrup until caramelised.',
                    'Serve oats topped with banana and toasted coconut.',
                ],
                'nutrition'    => ['calories' => 410, 'protein' => 7, 'fat' => 16, 'carbs' => 60, 'fiber' => 6],
                'sort_order'   => 3,
                'is_active'    => true,
            ],
            [
                'id'           => 'recipe-p10',
                'name'         => 'Berry Chia Overnight Pudding',
                'image'        => '',
                'base_servings' => 1,
                'module_id'    => 'module-breakfast-premium',
                'category_id'  => 'cat-plantbased',
                'tags'         => ['no-cook', 'plant-based', 'prep-ahead', 'high-fiber'],
                'ingredients'  => [
                    ['name' => 'Chia seeds',        'quantity' => 3,   'unit' => 'tbsp', 'category' => 'Seeds & Nuts'],
                    ['name' => 'Oat milk',          'quantity' => 200, 'unit' => 'ml',   'category' => 'Dairy'],
                    ['name' => 'Maple syrup',       'quantity' => 1,   'unit' => 'tsp',  'category' => 'Condiments'],
                    ['name' => 'Mixed berries',     'quantity' => 80,  'unit' => 'g',    'category' => 'Fruits'],
                    ['name' => 'Granola',           'quantity' => 2,   'unit' => 'tbsp', 'category' => 'Grains'],
                ],
                'steps'        => [
                    'Mix chia seeds, oat milk, and maple syrup in a jar.',
                    'Stir well and refrigerate overnight.',
                    'In the morning, top with berries and granola.',
                ],
                'nutrition'    => ['calories' => 290, 'protein' => 8, 'fat' => 10, 'carbs' => 42, 'fiber' => 11],
                'sort_order'   => 4,
                'is_active'    => true,
            ],
        ];

        foreach ($recipes as $recipe) {
            Recipe::updateOrCreate(['id' => $recipe['id']], $recipe);
        }
    }
}
