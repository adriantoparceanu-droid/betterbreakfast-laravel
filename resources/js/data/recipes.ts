import type { Recipe } from '@/types/app';

export const recipes: Recipe[] = [
  {
    id: 'recipe-01',
    name: 'Overnight Oats with Berries',
    image: '/recipes/overnight-oats.jpg',
    baseServings: 2,
    tags: ['no-cook', 'prep-ahead', 'high-fiber'],
    ingredients: [
      { name: 'Rolled oats',     quantity: 1,   unit: 'cup',  category: 'Grains & Legumes' },
      { name: 'Milk',            quantity: 1,   unit: 'cup',  category: 'Dairy' },
      { name: 'Chia seeds',      quantity: 2,   unit: 'tbsp', category: 'Fats, Nuts & Seeds' },
      { name: 'Honey',           quantity: 1,   unit: 'tbsp', category: 'Condiments' },
      { name: 'Mixed berries',   quantity: 0.5, unit: 'cup',  category: 'Fruits' },
      { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp',  category: 'Condiments' },
    ],
    steps: [
      'Combine oats, milk, chia seeds, honey, and vanilla in a jar or bowl.',
      'Stir well, cover, and refrigerate overnight (at least 6 hours).',
      'In the morning, stir and add a splash of milk if too thick.',
      'Top with mixed berries and serve cold.',
    ],
    nutrition: { calories: 320, protein: 11, fat: 7, carbs: 54, fiber: 8 },
  },
  {
    id: 'recipe-02',
    name: 'Greek Yogurt Berry Parfait',
    image: '/recipes/yogurt-parfait.jpg',
    baseServings: 2,
    tags: ['no-cook', 'high-protein', 'quick'],
    ingredients: [
      { name: 'Greek yogurt',  quantity: 2,    unit: 'cups', category: 'Dairy' },
      { name: 'Granola',       quantity: 0.5,  unit: 'cup',  category: 'Grains & Legumes' },
      { name: 'Strawberries',  quantity: 0.5,  unit: 'cup',  category: 'Fruits' },
      { name: 'Blueberries',   quantity: 0.25, unit: 'cup',  category: 'Fruits' },
      { name: 'Honey',         quantity: 2,    unit: 'tsp',  category: 'Condiments' },
    ],
    steps: [
      'Spoon half the yogurt into two glasses or bowls.',
      'Add a layer of granola on top of the yogurt.',
      'Add strawberries and blueberries.',
      'Add remaining yogurt, top with more fruit and a drizzle of honey.',
    ],
    nutrition: { calories: 290, protein: 18, fat: 5, carbs: 42, fiber: 4 },
  },
  {
    id: 'recipe-03',
    name: 'Avocado Toast with Poached Egg',
    image: '/recipes/avocado-toast.jpg',
    baseServings: 2,
    tags: ['hot', 'high-protein', 'healthy-fats'],
    ingredients: [
      { name: 'Whole grain bread',    quantity: 2,    unit: 'slices', category: 'Grains & Legumes' },
      { name: 'Ripe avocado',         quantity: 1,    unit: 'whole',  category: 'Fruits' },
      { name: 'Eggs',                 quantity: 2,    unit: 'whole',  category: 'Proteins' },
      { name: 'Lemon juice',          quantity: 1,    unit: 'tsp',    category: 'Condiments' },
      { name: 'Red pepper flakes',    quantity: 0.25, unit: 'tsp',    category: 'Condiments' },
      { name: 'Salt and pepper',      quantity: 1,    unit: 'pinch',  category: 'Condiments' },
    ],
    steps: [
      'Toast the bread to your liking.',
      'Mash avocado with lemon juice, salt, and pepper.',
      'Bring a small pan of water to a gentle simmer, add a splash of vinegar.',
      'Crack each egg into a cup, slide into simmering water, cook 3 minutes.',
      'Spread avocado on toast, top with a poached egg and red pepper flakes.',
    ],
    nutrition: { calories: 380, protein: 16, fat: 22, carbs: 32, fiber: 9 },
  },
  {
    id: 'recipe-04',
    name: 'Spinach & Feta Scrambled Eggs',
    image: '/recipes/spinach-eggs.jpg',
    baseServings: 2,
    tags: ['hot', 'high-protein', 'low-carb'],
    ingredients: [
      { name: 'Eggs',         quantity: 4,    unit: 'whole', category: 'Proteins' },
      { name: 'Baby spinach', quantity: 1,    unit: 'cup',   category: 'Vegetables' },
      { name: 'Feta cheese',  quantity: 3,    unit: 'tbsp',  category: 'Dairy' },
      { name: 'Olive oil',    quantity: 1,    unit: 'tsp',   category: 'Condiments' },
      { name: 'Garlic powder',quantity: 0.25, unit: 'tsp',   category: 'Condiments' },
      { name: 'Salt and pepper', quantity: 1, unit: 'pinch', category: 'Condiments' },
    ],
    steps: [
      'Whisk eggs with salt, pepper, and garlic powder.',
      'Heat olive oil in a non-stick pan over medium-low heat.',
      'Add spinach and stir until just wilted, about 1 minute.',
      'Pour in eggs and fold gently until just set.',
      'Remove from heat and top with crumbled feta.',
    ],
    nutrition: { calories: 270, protein: 22, fat: 18, carbs: 3, fiber: 1 },
  },
  {
    id: 'recipe-05',
    name: 'Açaí Smoothie Bowl',
    image: '/recipes/acai-bowl.jpg',
    baseServings: 2,
    tags: ['no-cook', 'antioxidants'],
    ingredients: [
      { name: 'Frozen açaí packets', quantity: 2,    unit: 'packets', category: 'Fruits' },
      { name: 'Frozen banana',       quantity: 1,    unit: 'whole',   category: 'Fruits' },
      { name: 'Almond milk',         quantity: 0.25, unit: 'cup',     category: 'Dairy' },
      { name: 'Granola',             quantity: 0.25, unit: 'cup',     category: 'Grains & Legumes' },
      { name: 'Banana (sliced)',     quantity: 0.5,  unit: 'whole',   category: 'Fruits' },
      { name: 'Coconut flakes',      quantity: 2,    unit: 'tbsp',    category: 'Fats, Nuts & Seeds' },
      { name: 'Honey',               quantity: 1,    unit: 'tbsp',    category: 'Condiments' },
    ],
    steps: [
      'Blend açaí packets, frozen banana, and almond milk until thick and smooth.',
      'Pour into two bowls — mixture should be thick, not pourable.',
      'Top with granola, banana slices, and coconut flakes.',
      'Drizzle with honey and serve immediately.',
    ],
    nutrition: { calories: 310, protein: 5, fat: 10, carbs: 52, fiber: 7 },
  },
  {
    id: 'recipe-06',
    name: 'Chia Seed Pudding',
    image: '/recipes/chia-pudding.jpg',
    baseServings: 2,
    tags: ['no-cook', 'prep-ahead', 'high-fiber', 'omega-3'],
    ingredients: [
      { name: 'Chia seeds',   quantity: 6,   unit: 'tbsp', category: 'Fats, Nuts & Seeds' },
      { name: 'Coconut milk', quantity: 1.5, unit: 'cups', category: 'Dairy' },
      { name: 'Maple syrup',  quantity: 2,   unit: 'tsp',  category: 'Condiments' },
      { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', category: 'Condiments' },
      { name: 'Mango chunks', quantity: 0.5, unit: 'cup',  category: 'Fruits' },
      { name: 'Kiwi',         quantity: 1,   unit: 'whole',category: 'Fruits' },
    ],
    steps: [
      'Whisk chia seeds, coconut milk, maple syrup, and vanilla in a bowl.',
      'Let sit 5 minutes, then whisk again to prevent clumps.',
      'Cover and refrigerate overnight or at least 4 hours.',
      'Stir well in the morning and divide into two bowls.',
      'Top with mango chunks and sliced kiwi.',
    ],
    nutrition: { calories: 340, protein: 8, fat: 20, carbs: 32, fiber: 14 },
  },
  {
    id: 'recipe-07',
    name: 'Blueberry Whole Grain Pancakes',
    image: '/recipes/blueberry-pancakes.jpg',
    baseServings: 2,
    tags: ['hot', 'weekend', 'high-fiber'],
    ingredients: [
      { name: 'Whole wheat flour', quantity: 1,    unit: 'cup',  category: 'Grains & Legumes' },
      { name: 'Baking powder',     quantity: 1,    unit: 'tsp',  category: 'Condiments' },
      { name: 'Egg',               quantity: 1,    unit: 'whole',category: 'Proteins' },
      { name: 'Milk',              quantity: 0.75, unit: 'cup',  category: 'Dairy' },
      { name: 'Honey',             quantity: 1,    unit: 'tbsp', category: 'Condiments' },
      { name: 'Olive oil',         quantity: 1,    unit: 'tbsp', category: 'Condiments' },
      { name: 'Blueberries',       quantity: 0.5,  unit: 'cup',  category: 'Fruits' },
      { name: 'Greek yogurt',      quantity: 0.25, unit: 'cup',  category: 'Dairy' },
    ],
    steps: [
      'Mix whole wheat flour and baking powder in a bowl.',
      'Whisk egg, milk, honey, and olive oil in a separate bowl.',
      'Combine wet and dry ingredients — stir until just mixed (lumps are fine).',
      'Fold in blueberries.',
      'Cook ¼ cup portions on a lightly oiled pan over medium heat until bubbles form, then flip.',
      'Serve with a dollop of Greek yogurt.',
    ],
    nutrition: { calories: 420, protein: 14, fat: 10, carbs: 68, fiber: 8 },
  },
  {
    id: 'recipe-08',
    name: 'Mini Veggie Egg Muffins',
    image: '/recipes/egg-muffins.jpg',
    baseServings: 2,
    tags: ['hot', 'meal-prep', 'high-protein', 'low-carb'],
    ingredients: [
      { name: 'Eggs',            quantity: 4,    unit: 'whole',  category: 'Proteins' },
      { name: 'Cherry tomatoes', quantity: 6,    unit: 'whole',  category: 'Vegetables' },
      { name: 'Bell pepper',     quantity: 0.5,  unit: 'whole',  category: 'Vegetables' },
      { name: 'Spinach',         quantity: 0.25, unit: 'cup',    category: 'Vegetables' },
      { name: 'Cheddar cheese',  quantity: 2,    unit: 'tbsp',   category: 'Dairy' },
      { name: 'Salt and pepper', quantity: 1,    unit: 'pinch',  category: 'Condiments' },
    ],
    steps: [
      'Preheat oven to 180°C (350°F) and grease a muffin tin.',
      'Chop cherry tomatoes, bell pepper, and spinach.',
      'Divide vegetables among 4 muffin cups.',
      'Whisk eggs with salt and pepper, pour over vegetables.',
      'Top each cup with grated cheddar.',
      'Bake 18–20 minutes until set and lightly golden.',
    ],
    nutrition: { calories: 220, protein: 18, fat: 14, carbs: 5, fiber: 1 },
  },
  {
    id: 'recipe-09',
    name: 'Almond Butter Banana Toast',
    image: '/recipes/almond-toast.jpg',
    baseServings: 2,
    tags: ['no-cook', 'quick', 'healthy-fats'],
    ingredients: [
      { name: 'Sourdough bread', quantity: 2, unit: 'slices', category: 'Grains & Legumes' },
      { name: 'Almond butter',   quantity: 2, unit: 'tbsp',   category: 'Fats, Nuts & Seeds' },
      { name: 'Banana',          quantity: 1, unit: 'whole',  category: 'Fruits' },
      { name: 'Chia seeds',      quantity: 1, unit: 'tsp',    category: 'Fats, Nuts & Seeds' },
      { name: 'Cinnamon',        quantity: 0.25, unit: 'tsp', category: 'Condiments' },
      { name: 'Honey',           quantity: 1, unit: 'tsp',    category: 'Condiments' },
    ],
    steps: [
      'Toast the sourdough bread to your preference.',
      'Spread 1 tablespoon almond butter on each slice.',
      'Slice banana and arrange over the almond butter.',
      'Sprinkle with chia seeds and cinnamon, drizzle with honey.',
    ],
    nutrition: { calories: 350, protein: 10, fat: 14, carbs: 48, fiber: 6 },
  },
  {
    id: 'recipe-10',
    name: 'Green Protein Smoothie',
    image: '/recipes/green-smoothie.jpg',
    baseServings: 2,
    tags: ['no-cook', 'quick', 'high-protein'],
    ingredients: [
      { name: 'Baby spinach',  quantity: 2,   unit: 'cups', category: 'Vegetables' },
      { name: 'Frozen banana', quantity: 1,   unit: 'whole',category: 'Fruits' },
      { name: 'Greek yogurt',  quantity: 0.5, unit: 'cup',  category: 'Dairy' },
      { name: 'Almond milk',   quantity: 1,   unit: 'cup',  category: 'Dairy' },
      { name: 'Almond butter', quantity: 1,   unit: 'tbsp', category: 'Fats, Nuts & Seeds' },
      { name: 'Honey',         quantity: 1,   unit: 'tsp',  category: 'Condiments' },
    ],
    steps: [
      'Add all ingredients to a blender.',
      'Blend on high for 60 seconds until completely smooth.',
      'Add more almond milk if too thick.',
      'Pour into two glasses and serve immediately.',
    ],
    nutrition: { calories: 250, protein: 14, fat: 7, carbs: 36, fiber: 4 },
  },
];

export const recipeMap = new Map<string, Recipe>(
  recipes.map((r) => [r.id, r])
);

export function getRecipeById(id: string): Recipe | undefined {
  return recipeMap.get(id);
}

export function getAvailableRecipes(usedIds: string[]): Recipe[] {
  const used = new Set(usedIds);
  const available = recipes.filter((r) => !used.has(r.id));
  return available.length > 0 ? available : recipes;
}

// Toate categoriile în ordinea dorită pentru Staples
export const INGREDIENT_CATEGORIES = [
  'Proteins',
  'Grains',
  'Dairy',
  'Fruits',
  'Vegetables',
  'Seeds & Nuts',
  'Condiments',
] as const;
