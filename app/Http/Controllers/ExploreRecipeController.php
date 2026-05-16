<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\Recipe;
use Inertia\Inertia;
use Inertia\Response;

class ExploreRecipeController extends Controller
{
    public function show(string $id): Response|\Illuminate\Http\RedirectResponse
    {
        $user   = auth()->user();
        $recipe = Recipe::with('category')->findOrFail($id);

        if (! $recipe->category_id) {
            abort(404);
        }

        $hasAccess = $user->isAdmin()
            || $user->categories()->where('recipe_categories.id', $recipe->category_id)->exists();

        if (! $hasAccess) {
            return redirect()->route('explore');
        }

        $madeCount = $this->madeCount($user->id, $id);

        return Inertia::render('ExploreRecipe', [
            'recipe' => [
                'id'            => $recipe->id,
                'name'          => $recipe->name,
                'image'         => $recipe->image,
                'base_servings' => $recipe->base_servings,
                'ingredients'   => $recipe->ingredients,
                'steps'         => $recipe->steps,
                'nutrition'     => $recipe->nutrition,
                'tags'          => $recipe->tags,
                'substitutions' => $recipe->substitutions,
                'why_this_works'=> $recipe->why_this_works,
            ],
            'category' => [
                'id'   => $recipe->category->id,
                'name' => $recipe->category->name,
            ],
            'made_count' => $madeCount,
        ]);
    }

    private function madeCount(int $userId, string $recipeId): int
    {
        return AnalyticsEvent::where('user_id', $userId)
            ->where('event', 'EXPLORE_MADE_THIS')
            ->get(['properties'])
            ->filter(fn ($e) => ($e->properties['recipeId'] ?? null) === $recipeId)
            ->count();
    }
}
