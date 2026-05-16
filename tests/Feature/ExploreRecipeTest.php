<?php

namespace Tests\Feature;

use App\Models\AnalyticsEvent;
use App\Models\Module;
use App\Models\Recipe;
use App\Models\RecipeCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ExploreRecipeTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function makeCategory(): RecipeCategory
    {
        $module = Module::create([
            'id'          => 'module-explore-test',
            'name'        => 'Test Module',
            'slug'        => 'test-module',
            'description' => '',
            'price'       => 0,
            'is_active'   => true,
        ]);

        return RecipeCategory::create([
            'id'        => 'cat-test',
            'module_id' => $module->id,
            'name'      => 'High Protein',
            'slug'      => 'high-protein',
            'price'     => 3.99,
            'is_active' => true,
        ]);
    }

    private function makeRecipe(string $categoryId): Recipe
    {
        return Recipe::create([
            'id'            => 'recipe-test-1',
            'name'          => 'Protein Bowl',
            'image'         => '',
            'base_servings' => 1,
            'ingredients'   => [['name' => 'Eggs', 'quantity' => 2, 'unit' => 'pcs']],
            'steps'         => ['Boil eggs.'],
            'nutrition'     => ['calories' => 300, 'protein' => 25, 'fat' => 10, 'carbs' => 5, 'fiber' => 1],
            'tags'          => ['quick'],
            'is_active'     => true,
            'sort_order'    => 1,
            'category_id'   => $categoryId,
        ]);
    }

    private function grantCategoryAccess(User $user, string $categoryId): void
    {
        DB::table('user_categories')->insert([
            'user_id'      => $user->id,
            'category_id'  => $categoryId,
            'purchased_at' => now(),
        ]);
    }

    private function recordExploreMade(User $user, string $recipeId, string $categoryId): void
    {
        AnalyticsEvent::create([
            'user_id'      => $user->id,
            'anonymous_id' => "explore-{$recipeId}",
            'event'        => 'EXPLORE_MADE_THIS',
            'properties'   => ['recipeId' => $recipeId, 'categoryId' => $categoryId, 'recipeName' => 'Protein Bowl', 'categoryName' => 'High Protein'],
        ]);
    }

    // ─── ExploreRecipeController ───────────────────────────────────────────────

    public function test_guest_is_redirected_to_login(): void
    {
        $cat    = $this->makeCategory();
        $recipe = $this->makeRecipe($cat->id);

        $this->get(route('explore.recipe', $recipe->id))
            ->assertRedirect(route('login'));
    }

    public function test_user_without_category_access_is_redirected_to_explore(): void
    {
        $cat    = $this->makeCategory();
        $recipe = $this->makeRecipe($cat->id);
        $user   = User::factory()->create();

        $this->actingAs($user)
            ->get(route('explore.recipe', $recipe->id))
            ->assertRedirect(route('explore'));
    }

    public function test_user_with_category_access_can_view_recipe(): void
    {
        $cat    = $this->makeCategory();
        $recipe = $this->makeRecipe($cat->id);
        $user   = User::factory()->create();
        $this->grantCategoryAccess($user, $cat->id);

        $this->actingAs($user)
            ->get(route('explore.recipe', $recipe->id))
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('ExploreRecipe')
                ->where('recipe.id', $recipe->id)
                ->where('recipe.name', 'Protein Bowl')
                ->where('category.id', $cat->id)
                ->where('made_count', 0)
            );
    }

    public function test_admin_can_view_recipe_without_category_access(): void
    {
        $cat    = $this->makeCategory();
        $recipe = $this->makeRecipe($cat->id);
        $admin  = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('explore.recipe', $recipe->id))
            ->assertStatus(200);
    }

    public function test_recipe_without_category_returns_404(): void
    {
        $recipe = Recipe::create([
            'id'            => 'recipe-no-cat',
            'name'          => 'No Category',
            'image'         => '',
            'base_servings' => 1,
            'ingredients'   => [['name' => 'Oats', 'quantity' => 80, 'unit' => 'g']],
            'steps'         => ['Cook oats.'],
            'nutrition'     => ['calories' => 200, 'protein' => 8, 'fat' => 4, 'carbs' => 30, 'fiber' => 3],
            'is_active'     => true,
            'sort_order'    => 1,
            'category_id'   => null,
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('explore.recipe', $recipe->id))
            ->assertStatus(404);
    }

    public function test_made_count_reflects_user_events(): void
    {
        $cat    = $this->makeCategory();
        $recipe = $this->makeRecipe($cat->id);
        $user   = User::factory()->create();
        $this->grantCategoryAccess($user, $cat->id);

        $this->recordExploreMade($user, $recipe->id, $cat->id);
        $this->recordExploreMade($user, $recipe->id, $cat->id);

        $this->actingAs($user)
            ->get(route('explore.recipe', $recipe->id))
            ->assertInertia(fn ($page) => $page->where('made_count', 2));
    }

    public function test_made_count_is_per_user(): void
    {
        $cat     = $this->makeCategory();
        $recipe  = $this->makeRecipe($cat->id);
        $userA   = User::factory()->create();
        $userB   = User::factory()->create();
        $this->grantCategoryAccess($userA, $cat->id);
        $this->grantCategoryAccess($userB, $cat->id);

        // userB made it 5 times — should not affect userA's count
        foreach (range(1, 5) as $_) {
            $this->recordExploreMade($userB, $recipe->id, $cat->id);
        }

        $this->actingAs($userA)
            ->get(route('explore.recipe', $recipe->id))
            ->assertInertia(fn ($page) => $page->where('made_count', 0));
    }

    // ─── Analytics — EXPLORE_MADE_THIS event ──────────────────────────────────

    public function test_explore_made_this_event_is_stored(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/analytics', [
                'events' => [[
                    'anonymousId' => 'explore-recipe-test-1',
                    'event'       => 'EXPLORE_MADE_THIS',
                    'properties'  => [
                        'recipeId'     => 'recipe-test-1',
                        'recipeName'   => 'Protein Bowl',
                        'categoryId'   => 'cat-test',
                        'categoryName' => 'High Protein',
                    ],
                ]],
            ])
            ->assertJson(['ok' => true]);

        $this->assertDatabaseHas('analytics_events', [
            'user_id' => $user->id,
            'event'   => 'EXPLORE_MADE_THIS',
        ]);
    }

    public function test_unknown_event_type_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/analytics', [
                'events' => [[
                    'anonymousId' => 'explore-recipe-test-1',
                    'event'       => 'UNKNOWN_EVENT',
                    'properties'  => [],
                ]],
            ])
            ->assertStatus(422);
    }

    // ─── Api/ExploreController — made_counts ──────────────────────────────────

    public function test_api_explore_includes_made_count_for_unlocked_recipes(): void
    {
        $cat    = $this->makeCategory();
        $recipe = $this->makeRecipe($cat->id);
        $user   = User::factory()->create();
        $this->grantCategoryAccess($user, $cat->id);

        $this->recordExploreMade($user, $recipe->id, $cat->id);
        $this->recordExploreMade($user, $recipe->id, $cat->id);
        $this->recordExploreMade($user, $recipe->id, $cat->id);

        $response = $this->actingAs($user)
            ->getJson('/api/explore')
            ->assertOk()
            ->json();

        $recipes = collect($response['categories'][0]['recipes']);
        $found   = $recipes->firstWhere('id', $recipe->id);

        $this->assertNotNull($found);
        $this->assertEquals(3, $found['made_count']);
    }

    public function test_api_explore_made_count_is_zero_when_no_events(): void
    {
        $cat    = $this->makeCategory();
        $recipe = $this->makeRecipe($cat->id);
        $user   = User::factory()->create();
        $this->grantCategoryAccess($user, $cat->id);

        $response = $this->actingAs($user)
            ->getJson('/api/explore')
            ->assertOk()
            ->json();

        $recipes = collect($response['categories'][0]['recipes']);
        $found   = $recipes->firstWhere('id', $recipe->id);

        $this->assertEquals(0, $found['made_count']);
    }
}
