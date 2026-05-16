<?php

namespace Tests\Feature\Admin;

use App\Models\Module;
use App\Models\Recipe;
use App\Models\RecipeCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for the unified Recipes + Categories admin page.
 */
class RecipesPageTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function makeModule(string $id = 'module-10day', string $name = '10-Day Breakfast Plan'): Module
    {
        return Module::create([
            'id'          => $id,
            'name'        => $name,
            'slug'        => 'breakfast-10-day',
            'description' => '',
            'price'       => 9.99,
            'is_active'   => true,
        ]);
    }

    private function makeCategory(Module $module, array $overrides = []): RecipeCategory
    {
        return RecipeCategory::create(array_merge([
            'id'        => 'cat-high-protein',
            'module_id' => $module->id,
            'name'      => 'High Protein',
            'slug'      => 'high-protein',
            'description' => 'Great for gains',
            'price'     => 3.99,
            'sort_order' => 1,
            'is_active' => true,
        ], $overrides));
    }

    private function makeRecipe(array $overrides = []): Recipe
    {
        static $counter = 0;
        $counter++;
        return Recipe::create(array_merge([
            'id'            => "recipe-test-{$counter}",
            'name'          => "Test Recipe {$counter}",
            'image'         => '',
            'base_servings' => 1,
            'ingredients'   => [['name' => 'Oats', 'quantity' => 80, 'unit' => 'g']],
            'steps'         => ['Cook.'],
            'nutrition'     => ['calories' => 300, 'protein' => 20, 'fat' => 8, 'carbs' => 35, 'fiber' => 4],
            'tags'          => [],
            'is_active'     => true,
            'sort_order'    => $counter,
        ], $overrides));
    }

    // ─── Access control ────────────────────────────────────────────────────────

    public function test_guest_cannot_access_recipes_page(): void
    {
        $this->get(route('admin.recipes'))->assertRedirect(route('login'));
    }

    public function test_non_admin_cannot_access_recipes_page(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.recipes'))
            ->assertStatus(403);
    }

    public function test_admin_can_access_recipes_page(): void
    {
        $this->actingAs($this->admin())
            ->get(route('admin.recipes'))
            ->assertStatus(200);
    }

    // ─── /admin/categories redirect ────────────────────────────────────────────

    public function test_categories_route_redirects_to_recipes(): void
    {
        $this->actingAs($this->admin())
            ->get(route('admin.categories'))
            ->assertRedirect(route('admin.recipes'));
    }

    // ─── Full category data in page props ─────────────────────────────────────

    public function test_recipes_page_passes_full_category_data(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        $this->actingAs($this->admin())
            ->get(route('admin.recipes'))
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Recipes')
                ->has('categories', 1, fn ($c) => $c
                    ->where('id',           $cat->id)
                    ->where('name',         'High Protein')
                    ->where('slug',         'high-protein')
                    ->where('description',  'Great for gains')
                    ->where('price',        3.99)
                    ->where('isActive',     true)
                    ->where('recipesCount', 0)
                    ->where('sortOrder',    1)
                    ->where('moduleId',     $module->id)
                    ->etc()
                )
            );
    }

    public function test_recipes_count_in_category_is_accurate(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        $this->makeRecipe(['category_id' => $cat->id, 'module_id' => null]);
        $this->makeRecipe(['category_id' => $cat->id, 'module_id' => null]);

        $this->actingAs($this->admin())
            ->get(route('admin.recipes'))
            ->assertInertia(fn ($page) => $page
                ->has('categories', 1, fn ($c) => $c
                    ->where('recipesCount', 2)
                    ->etc()
                )
            );
    }

    public function test_inactive_categories_are_included_in_page_props(): void
    {
        $module = $this->makeModule();
        $this->makeCategory($module, ['id' => 'cat-inactive', 'slug' => 'inactive', 'is_active' => false]);

        $this->actingAs($this->admin())
            ->get(route('admin.recipes'))
            ->assertInertia(fn ($page) => $page
                ->has('categories', 1, fn ($c) => $c
                    ->where('isActive', false)
                    ->etc()
                )
            );
    }

    // ─── Recipe data includes module and category associations ─────────────────

    public function test_recipes_include_module_association(): void
    {
        $module = $this->makeModule();
        $recipe = $this->makeRecipe(['module_id' => $module->id]);

        $this->actingAs($this->admin())
            ->get(route('admin.recipes'))
            ->assertInertia(fn ($page) => $page
                ->has('recipes', 1, fn ($r) => $r
                    ->where('id', $recipe->id)
                    ->has('module')
                    ->where('module.id', $module->id)
                    ->where('category', null)
                    ->etc()
                )
            );
    }

    public function test_recipes_include_category_association(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);
        $recipe = $this->makeRecipe(['category_id' => $cat->id, 'module_id' => null]);

        $this->actingAs($this->admin())
            ->get(route('admin.recipes'))
            ->assertInertia(fn ($page) => $page
                ->has('recipes', 1, fn ($r) => $r
                    ->where('id', $recipe->id)
                    ->where('module', null)
                    ->has('category')
                    ->where('category.id', $cat->id)
                    ->etc()
                )
            );
    }

    public function test_multiple_categories_returned_in_sort_order(): void
    {
        $module = $this->makeModule();
        RecipeCategory::create(['id' => 'cat-b', 'module_id' => $module->id, 'name' => 'B', 'slug' => 'b', 'price' => 1, 'sort_order' => 2, 'is_active' => true]);
        RecipeCategory::create(['id' => 'cat-a', 'module_id' => $module->id, 'name' => 'A', 'slug' => 'a', 'price' => 1, 'sort_order' => 1, 'is_active' => true]);

        $this->actingAs($this->admin())
            ->get(route('admin.recipes'))
            ->assertInertia(fn ($page) => $page
                ->has('categories', 2)
                ->where('categories.0.id', 'cat-a')
                ->where('categories.1.id', 'cat-b')
            );
    }
}
