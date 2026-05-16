<?php

namespace Tests\Feature;

use App\Models\MasterIngredient;
use App\Models\Module;
use App\Models\Recipe;
use App\Models\RecipeCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Covers the i18n feature: AI translation endpoint, translations
 * persistence across admin controllers, and that the `translations`
 * column is serialized to every client surface (api + Inertia props).
 */
class I18nTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function breakfastModule(): Module
    {
        return Module::create([
            'id'          => 'module-breakfast-10day',
            'name'        => '10-Day Breakfast Plan',
            'slug'        => 'breakfast-10-day',
            'description' => 'The plan',
            'price'       => 9.99,
            'is_active'   => true,
        ]);
    }

    private function recipePayload(array $overrides = []): array
    {
        return array_merge([
            'name'          => 'Test Bowl',
            'image'         => '',
            'base_servings' => 1,
            'sort_order'    => 5,
            'is_active'     => true,
            'module_id'     => null,
            'tags'          => ['quick'],
            'nutrition'     => ['calories' => 400, 'protein' => 30, 'fat' => 15, 'carbs' => 40, 'fiber' => 8],
            'ingredients'   => [['name' => 'Oats', 'quantity' => 80, 'unit' => 'g', 'category' => 'Grains']],
            'steps'         => ['Boil water.', 'Add oats.'],
        ], $overrides);
    }

    private function fakeGemini(array $object): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [['text' => json_encode($object, JSON_UNESCAPED_UNICODE)]]],
                ]],
            ], 200),
        ]);
    }

    // ─── TranslationController — auth ──────────────────────────────────────────

    public function test_translate_requires_authentication(): void
    {
        $this->post(route('admin.translate'), ['type' => 'field', 'payload' => ['text' => 'Hi']])
            ->assertRedirect(route('login'));
    }

    public function test_translate_forbidden_for_non_admin(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('admin.translate'), ['type' => 'field', 'payload' => ['text' => 'Hi']])
            ->assertStatus(403);
    }

    // ─── TranslationController — validation ────────────────────────────────────

    public function test_translate_rejects_unknown_type(): void
    {
        $this->actingAs($this->admin())
            ->postJson(route('admin.translate'), ['type' => 'bogus', 'payload' => ['text' => 'Hi']])
            ->assertStatus(422);
    }

    public function test_translate_requires_payload(): void
    {
        $this->actingAs($this->admin())
            ->postJson(route('admin.translate'), ['type' => 'field'])
            ->assertStatus(422);
    }

    // ─── TranslationController — success per type ──────────────────────────────

    public function test_translate_recipe_returns_structured_translation(): void
    {
        config(['services.gemini.key' => 'test-key']);
        $this->fakeGemini([
            'name'          => 'Bol de Test',
            'ingredients'   => [['name' => 'Ovăz']],
            'steps'         => ['Fierbe apa.'],
            'substitutions' => 'Variante',
            'whyThisWorks'  => 'Pentru că da',
        ]);

        $this->actingAs($this->admin())
            ->postJson(route('admin.translate'), [
                'type'    => 'recipe',
                'payload' => ['name' => 'Test Bowl', 'ingredients' => [['name' => 'Oats']], 'steps' => ['Boil water.']],
            ])
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'translation' => [
                    'name'        => 'Bol de Test',
                    'ingredients' => [['name' => 'Ovăz']],
                    'steps'       => ['Fierbe apa.'],
                ],
            ]);
    }

    public function test_translate_field_returns_text(): void
    {
        config(['services.gemini.key' => 'test-key']);
        $this->fakeGemini(['text' => 'Salată grecească']);

        $this->actingAs($this->admin())
            ->postJson(route('admin.translate'), ['type' => 'field', 'payload' => ['text' => 'Greek Salad']])
            ->assertOk()
            ->assertJson(['ok' => true, 'translation' => ['text' => 'Salată grecească']]);
    }

    public function test_translate_list_returns_items(): void
    {
        config(['services.gemini.key' => 'test-key']);
        $this->fakeGemini(['items' => ['Pas unu', 'Pas doi']]);

        $this->actingAs($this->admin())
            ->postJson(route('admin.translate'), ['type' => 'list', 'payload' => ['items' => ['Step one', 'Step two']]])
            ->assertOk()
            ->assertJson(['ok' => true, 'translation' => ['items' => ['Pas unu', 'Pas doi']]]);
    }

    public function test_translate_fails_without_api_key(): void
    {
        config(['services.gemini.key' => null]);

        $this->actingAs($this->admin())
            ->postJson(route('admin.translate'), ['type' => 'field', 'payload' => ['text' => 'Hi']])
            ->assertStatus(500);
    }

    public function test_translate_handles_gemini_api_error(): void
    {
        config(['services.gemini.key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response('', 500)]);

        $this->actingAs($this->admin())
            ->postJson(route('admin.translate'), ['type' => 'field', 'payload' => ['text' => 'Hi']])
            ->assertStatus(502);
    }

    // ─── Recipe — translations persistence ─────────────────────────────────────

    public function test_recipe_store_persists_ro_translation(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.recipes.store'), $this->recipePayload([
                'translations' => ['ro' => [
                    'name'        => 'Bol de Test',
                    'steps'       => ['Fierbe apa.'],
                    'ingredients' => [['name' => 'Ovăz']],
                ]],
            ]))
            ->assertSessionHasNoErrors();

        $recipe = Recipe::where('name', 'Test Bowl')->firstOrFail();
        $this->assertSame('Bol de Test', $recipe->translations['ro']['name']);
        $this->assertSame(['Fierbe apa.'], $recipe->translations['ro']['steps']);
    }

    public function test_recipe_store_drops_empty_ro_block(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.recipes.store'), $this->recipePayload([
                'name'         => 'Empty RO Bowl',
                'translations' => ['ro' => ['name' => '', 'steps' => []]],
            ]))
            ->assertSessionHasNoErrors();

        $recipe = Recipe::where('name', 'Empty RO Bowl')->firstOrFail();
        $this->assertNull($recipe->translations);
    }

    public function test_recipe_update_persists_translation(): void
    {
        $recipe = Recipe::create(array_merge($this->recipePayload(), ['id' => 'rec-tr-1']));

        $this->actingAs($this->admin())
            ->put(route('admin.recipes.update', $recipe->id), $this->recipePayload([
                'translations' => ['ro' => ['name' => 'Bol Actualizat']],
            ]));

        $this->assertSame('Bol Actualizat', $recipe->fresh()->translations['ro']['name']);
    }

    public function test_recipe_edit_exposes_translations_to_form(): void
    {
        $recipe = Recipe::create(array_merge($this->recipePayload(), [
            'id'           => 'rec-tr-2',
            'translations' => ['ro' => ['name' => 'Bol RO']],
        ]));

        $this->actingAs($this->admin())
            ->get(route('admin.recipes.edit', $recipe->id))
            ->assertInertia(fn ($page) => $page
                ->component('Admin/RecipeForm')
                ->where('recipe.translations.ro.name', 'Bol RO')
            );
    }

    // ─── Serialization — translations reach every client surface ───────────────

    public function test_api_recipes_includes_translations(): void
    {
        $module = $this->breakfastModule();
        Recipe::create(array_merge($this->recipePayload(), [
            'id'           => 'rec-api-1',
            'module_id'    => $module->id,
            'translations' => ['ro' => ['name' => 'Bol API']],
        ]));

        $json = $this->actingAs(User::factory()->create())
            ->getJson('/api/recipes')
            ->assertOk()
            ->json();

        $found = collect($json['recipes'])->firstWhere('id', 'rec-api-1');
        $this->assertSame('Bol API', $found['translations']['ro']['name']);
    }

    public function test_api_recipes_translations_null_when_absent(): void
    {
        $module = $this->breakfastModule();
        Recipe::create(array_merge($this->recipePayload(), ['id' => 'rec-api-2', 'module_id' => $module->id]));

        $json = $this->actingAs(User::factory()->create())
            ->getJson('/api/recipes')
            ->assertOk()
            ->json();

        $found = collect($json['recipes'])->firstWhere('id', 'rec-api-2');
        $this->assertNull($found['translations']);
    }

    public function test_api_explore_includes_category_and_recipe_translations(): void
    {
        $module = $this->breakfastModule();
        $cat = RecipeCategory::create([
            'id'           => 'cat-tr',
            'module_id'    => $module->id,
            'name'         => 'High Protein',
            'slug'         => 'high-protein',
            'price'        => 3.99,
            'is_active'    => true,
            'translations' => ['ro' => ['name' => 'Bogat în Proteine', 'description' => 'Descriere RO']],
        ]);
        Recipe::create(array_merge($this->recipePayload(), [
            'id'           => 'rec-exp-1',
            'category_id'  => $cat->id,
            'translations' => ['ro' => ['name' => 'Rețetă RO']],
        ]));

        $user = User::factory()->create();
        DB::table('user_categories')->insert([
            'user_id' => $user->id, 'category_id' => $cat->id, 'purchased_at' => now(),
        ]);

        $json = $this->actingAs($user)->getJson('/api/explore')->assertOk()->json();

        $category = collect($json['categories'])->firstWhere('id', 'cat-tr');
        $this->assertSame('Bogat în Proteine', $category['translations']['ro']['name']);
        $recipe = collect($category['recipes'])->firstWhere('id', 'rec-exp-1');
        $this->assertSame('Rețetă RO', $recipe['translations']['ro']['name']);
    }

    public function test_explore_recipe_inertia_includes_translations(): void
    {
        $module = $this->breakfastModule();
        $cat = RecipeCategory::create([
            'id'           => 'cat-tr2',
            'module_id'    => $module->id,
            'name'         => 'High Protein',
            'slug'         => 'hp2',
            'price'        => 3.99,
            'is_active'    => true,
            'translations' => ['ro' => ['name' => 'Categorie RO']],
        ]);
        $recipe = Recipe::create(array_merge($this->recipePayload(), [
            'id'           => 'rec-exp-2',
            'category_id'  => $cat->id,
            'translations' => ['ro' => ['name' => 'Detaliu RO']],
        ]));

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('explore.recipe', $recipe->id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('ExploreRecipe')
                ->where('recipe.translations.ro.name', 'Detaliu RO')
                ->where('category.translations.ro.name', 'Categorie RO')
            );
    }

    public function test_purchase_inertia_includes_module_translations(): void
    {
        $module = $this->breakfastModule();
        $module->update(['translations' => ['ro' => ['name' => 'Plan RO', 'description' => 'Desc RO']]]);

        $this->actingAs(User::factory()->create())
            ->get(route('purchase'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Purchase')
                ->where('module.translations.ro.name', 'Plan RO')
            );
    }

    // ─── Module / Category / Ingredient — translations persistence ─────────────

    public function test_module_update_persists_translations(): void
    {
        $module = $this->breakfastModule();

        $this->actingAs($this->admin())
            ->patch(route('admin.modules.update', $module->id), [
                'name'         => '10-Day Breakfast Plan',
                'description'  => 'The plan',
                'price'        => 9.99,
                'translations' => ['ro' => ['name' => 'Plan RO', 'description' => 'Desc RO']],
            ])
            ->assertRedirect();

        $this->assertSame('Plan RO', $module->fresh()->translations['ro']['name']);
    }

    public function test_module_update_clears_empty_translations(): void
    {
        $module = $this->breakfastModule();
        $module->update(['translations' => ['ro' => ['name' => 'Vechi']]]);

        $this->actingAs($this->admin())
            ->patch(route('admin.modules.update', $module->id), [
                'name'         => '10-Day Breakfast Plan',
                'translations' => ['ro' => ['name' => '', 'description' => '']],
            ])
            ->assertRedirect();

        $this->assertNull($module->fresh()->translations);
    }

    public function test_category_update_persists_translations(): void
    {
        $module = $this->breakfastModule();
        $cat = RecipeCategory::create([
            'id'        => 'cat-up',
            'module_id' => $module->id,
            'name'      => 'High Protein',
            'slug'      => 'hp-up',
            'price'     => 3.99,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->actingAs($this->admin())
            ->patch(route('admin.categories.update', $cat->id), [
                'name'         => 'High Protein',
                'description'  => 'EN desc',
                'price'        => 3.99,
                'sort_order'   => 1,
                'translations' => ['ro' => ['name' => 'Bogat Proteine', 'description' => 'Desc RO']],
            ])
            ->assertRedirect();

        $this->assertSame('Bogat Proteine', $cat->fresh()->translations['ro']['name']);
    }

    public function test_ingredient_store_persists_ro_name(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.ingredients.store'), [
                'name'                => 'Greek Yogurt',
                'category'            => 'Dairy',
                'translation_ro_name' => 'Iaurt grecesc',
            ])
            ->assertRedirect();

        $ing = MasterIngredient::where('name', 'Greek Yogurt')->firstOrFail();
        $this->assertSame('Iaurt grecesc', $ing->translations['ro']['name']);
    }

    public function test_ingredient_update_persists_and_index_exposes_ro_name(): void
    {
        $ing = MasterIngredient::create(['name' => 'Oats', 'category' => 'Grains & Legumes']);

        $this->actingAs($this->admin())
            ->patch(route('admin.ingredients.update', $ing->id), [
                'name'                => 'Oats',
                'category'            => 'Grains & Legumes',
                'translation_ro_name' => 'Ovăz',
            ])
            ->assertRedirect();

        $this->assertSame('Ovăz', $ing->fresh()->translations['ro']['name']);

        $this->actingAs($this->admin())
            ->get(route('admin.ingredients'))
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Ingredients')
                ->where('ingredients.0.translationRo', 'Ovăz')
            );
    }

    public function test_ingredient_blank_ro_name_stores_null(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.ingredients.store'), [
                'name'                => 'Plain Salt',
                'category'            => 'Condiments',
                'translation_ro_name' => '',
            ])
            ->assertRedirect();

        $this->assertNull(MasterIngredient::where('name', 'Plain Salt')->firstOrFail()->translations);
    }
}
