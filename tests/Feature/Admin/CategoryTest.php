<?php

namespace Tests\Feature\Admin;

use App\Models\Module;
use App\Models\Recipe;
use App\Models\RecipeCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for Category CRUD accessible from the unified Recipes page sidebar.
 */
class CategoryTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function makeModule(): Module
    {
        return Module::create([
            'id'          => 'module-test',
            'name'        => 'Test Module',
            'slug'        => 'test-module',
            'description' => '',
            'price'       => 0,
            'is_active'   => true,
        ]);
    }

    private function makeCategory(Module $module, array $overrides = []): RecipeCategory
    {
        return RecipeCategory::create(array_merge([
            'id'        => 'cat-test',
            'module_id' => $module->id,
            'name'      => 'High Protein',
            'slug'      => 'high-protein',
            'price'     => 3.99,
            'sort_order' => 1,
            'is_active' => true,
        ], $overrides));
    }

    // ─── Store ─────────────────────────────────────────────────────────────────

    public function test_admin_can_create_category(): void
    {
        $module = $this->makeModule();

        $this->actingAs($this->admin())
            ->post(route('admin.categories.store'), [
                'name'        => 'Vegan',
                'module_id'   => $module->id,
                'description' => 'Plant-based recipes',
                'price'       => 4.99,
                'sort_order'  => 5,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('recipe_categories', [
            'name'      => 'Vegan',
            'module_id' => $module->id,
            'price'     => 4.99,
            'is_active' => true,
        ]);
    }

    public function test_store_auto_generates_slug_from_name(): void
    {
        $module = $this->makeModule();

        $this->actingAs($this->admin())
            ->post(route('admin.categories.store'), [
                'name'       => 'High Protein',
                'module_id'  => $module->id,
                'price'      => 3.99,
                'sort_order' => 1,
            ]);

        $cat = RecipeCategory::where('name', 'High Protein')->first();
        $this->assertNotNull($cat);
        $this->assertStringContainsString('high-protein', $cat->slug);
    }

    public function test_store_requires_name(): void
    {
        $module = $this->makeModule();

        $this->actingAs($this->admin())
            ->post(route('admin.categories.store'), [
                'name'      => '',
                'module_id' => $module->id,
                'price'     => 3.99,
            ])
            ->assertSessionHasErrors('name');
    }

    public function test_store_requires_module_id(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.categories.store'), [
                'name'  => 'Vegan',
                'price' => 3.99,
            ])
            ->assertSessionHasErrors('module_id');
    }

    public function test_store_requires_valid_module_id(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.categories.store'), [
                'name'      => 'Vegan',
                'module_id' => 'nonexistent-module',
                'price'     => 3.99,
            ])
            ->assertSessionHasErrors('module_id');
    }

    public function test_store_requires_price(): void
    {
        $module = $this->makeModule();

        $this->actingAs($this->admin())
            ->post(route('admin.categories.store'), [
                'name'      => 'Vegan',
                'module_id' => $module->id,
            ])
            ->assertSessionHasErrors('price');
    }

    public function test_non_admin_cannot_create_category(): void
    {
        $module = $this->makeModule();

        $this->actingAs(User::factory()->create())
            ->post(route('admin.categories.store'), [
                'name'      => 'Vegan',
                'module_id' => $module->id,
                'price'     => 3.99,
            ])
            ->assertStatus(403);
    }

    // ─── Update ────────────────────────────────────────────────────────────────

    public function test_admin_can_update_category(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        $this->actingAs($this->admin())
            ->patch(route('admin.categories.update', $cat->id), [
                'name'        => 'High Protein Plus',
                'description' => 'Updated description',
                'price'       => 5.99,
                'sort_order'  => 2,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('recipe_categories', [
            'id'    => $cat->id,
            'name'  => 'High Protein Plus',
            'price' => 5.99,
        ]);
    }

    public function test_update_requires_name(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        $this->actingAs($this->admin())
            ->patch(route('admin.categories.update', $cat->id), [
                'name'  => '',
                'price' => 3.99,
            ])
            ->assertSessionHasErrors('name');
    }

    public function test_update_requires_price(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        $this->actingAs($this->admin())
            ->patch(route('admin.categories.update', $cat->id), [
                'name' => 'High Protein',
            ])
            ->assertSessionHasErrors('price');
    }

    public function test_non_admin_cannot_update_category(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        $this->actingAs(User::factory()->create())
            ->patch(route('admin.categories.update', $cat->id), [
                'name'  => 'Hacked',
                'price' => 0,
            ])
            ->assertStatus(403);
    }

    // ─── Toggle ────────────────────────────────────────────────────────────────

    public function test_admin_can_deactivate_active_category(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module, ['is_active' => true]);

        $this->actingAs($this->admin())
            ->patch(route('admin.categories.toggle', $cat->id))
            ->assertRedirect();

        $this->assertDatabaseHas('recipe_categories', ['id' => $cat->id, 'is_active' => false]);
    }

    public function test_admin_can_activate_inactive_category(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module, ['is_active' => false]);

        $this->actingAs($this->admin())
            ->patch(route('admin.categories.toggle', $cat->id))
            ->assertRedirect();

        $this->assertDatabaseHas('recipe_categories', ['id' => $cat->id, 'is_active' => true]);
    }

    public function test_non_admin_cannot_toggle_category(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        $this->actingAs(User::factory()->create())
            ->patch(route('admin.categories.toggle', $cat->id))
            ->assertStatus(403);
    }

    // ─── Destroy ───────────────────────────────────────────────────────────────

    public function test_admin_can_delete_category(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        $this->actingAs($this->admin())
            ->delete(route('admin.categories.destroy', $cat->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('recipe_categories', ['id' => $cat->id]);
    }

    public function test_deleting_nonexistent_category_returns_404(): void
    {
        $this->actingAs($this->admin())
            ->delete(route('admin.categories.destroy', 'nonexistent'))
            ->assertStatus(404);
    }

    public function test_non_admin_cannot_delete_category(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.categories.destroy', $cat->id))
            ->assertStatus(403);
    }

    // ─── Recipe count accuracy after mutations ─────────────────────────────────

    public function test_recipe_count_updates_after_recipe_assigned_to_category(): void
    {
        $module = $this->makeModule();
        $cat    = $this->makeCategory($module);

        Recipe::create([
            'id'            => 'recipe-cat-1',
            'name'          => 'Protein Bowl',
            'image'         => '',
            'base_servings' => 1,
            'ingredients'   => [['name' => 'Eggs', 'quantity' => 2, 'unit' => 'pcs']],
            'steps'         => ['Cook eggs.'],
            'nutrition'     => ['calories' => 200, 'protein' => 18, 'fat' => 10, 'carbs' => 2, 'fiber' => 0],
            'is_active'     => true,
            'sort_order'    => 1,
            'category_id'   => $cat->id,
        ]);

        $this->actingAs($this->admin())
            ->get(route('admin.recipes'))
            ->assertInertia(fn ($page) => $page
                ->where('categories.0.recipesCount', 1)
            );
    }
}
