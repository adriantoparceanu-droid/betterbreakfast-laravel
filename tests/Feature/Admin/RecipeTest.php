<?php

namespace Tests\Feature\Admin;

use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecipeTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
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
            'tags'          => ['quick', 'healthy'],
            'nutrition'     => [
                'calories' => 400,
                'protein'  => 30,
                'fat'      => 15,
                'carbs'    => 40,
                'fiber'    => 8,
            ],
            'ingredients' => [
                ['name' => 'Oats', 'quantity' => 80, 'unit' => 'g', 'category' => 'Grains'],
            ],
            'steps' => ['Boil water.', 'Add oats.'],
        ], $overrides);
    }

    public function test_admin_can_view_recipes_page(): void
    {
        $response = $this->actingAs($this->admin())->get(route('admin.recipes'));

        $response->assertStatus(200);
    }

    public function test_non_admin_cannot_view_recipes_page(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('admin.recipes'));

        $response->assertStatus(403);
    }

    public function test_admin_can_create_recipe(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.store'), $this->recipePayload());

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('recipes', ['name' => 'Test Bowl']);
    }

    public function test_create_recipe_requires_name(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.store'), $this->recipePayload(['name' => '']));

        $response->assertSessionHasErrors('name');
    }

    public function test_create_recipe_requires_at_least_one_ingredient(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.store'), $this->recipePayload(['ingredients' => []]));

        $response->assertSessionHasErrors('ingredients');
    }

    public function test_create_recipe_requires_at_least_one_step(): void
    {
        $response = $this->actingAs($this->admin())
            ->post(route('admin.recipes.store'), $this->recipePayload(['steps' => []]));

        $response->assertSessionHasErrors('steps');
    }

    public function test_admin_can_update_recipe(): void
    {
        $recipe = Recipe::create(array_merge($this->recipePayload(), ['id' => 'test-recipe-1']));

        $this->actingAs($this->admin())
            ->put(route('admin.recipes.update', $recipe->id), $this->recipePayload(['name' => 'Updated Bowl']));

        $this->assertDatabaseHas('recipes', ['id' => $recipe->id, 'name' => 'Updated Bowl']);
    }

    public function test_admin_can_delete_recipe(): void
    {
        $recipe = Recipe::create(array_merge($this->recipePayload(), ['id' => 'test-recipe-2']));

        $this->actingAs($this->admin())
            ->delete(route('admin.recipes.destroy', $recipe->id));

        $this->assertDatabaseMissing('recipes', ['id' => $recipe->id]);
    }

    public function test_admin_can_toggle_recipe_active_status(): void
    {
        $recipe = Recipe::create(array_merge($this->recipePayload(), ['id' => 'test-recipe-3', 'is_active' => true]));

        $this->actingAs($this->admin())
            ->patch(route('admin.recipes.toggle', $recipe->id));

        $this->assertDatabaseHas('recipes', ['id' => $recipe->id, 'is_active' => false]);
    }
}
