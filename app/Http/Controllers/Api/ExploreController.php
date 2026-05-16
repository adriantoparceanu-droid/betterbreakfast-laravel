<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use App\Models\RecipeCategory;
use Illuminate\Http\JsonResponse;

class ExploreController extends Controller
{
    public function index(): JsonResponse
    {
        $user        = auth()->user();
        $unlockedIds = $user->categories()->pluck('recipe_categories.id')->toArray();

        $madeCounts = [];
        AnalyticsEvent::where('user_id', $user->id)
            ->where('event', 'EXPLORE_MADE_THIS')
            ->get(['properties'])
            ->each(function ($e) use (&$madeCounts) {
                $id = $e->properties['recipeId'] ?? null;
                if ($id) $madeCounts[$id] = ($madeCounts[$id] ?? 0) + 1;
            });

        $categories = RecipeCategory::where('is_active', true)
            ->with(['recipes' => function ($q) {
                $q->where('is_active', true)
                  ->orderBy('sort_order')
                  ->select('id', 'name', 'image', 'base_servings', 'ingredients', 'steps', 'nutrition', 'tags', 'category_id', 'sort_order');
            }])
            ->orderBy('sort_order')
            ->get()
            ->map(function ($cat) use ($unlockedIds, $madeCounts) {
                $hasAccess = in_array($cat->id, $unlockedIds);

                return [
                    'id'           => $cat->id,
                    'name'         => $cat->name,
                    'slug'         => $cat->slug,
                    'description'  => $cat->description,
                    'price'        => $cat->price,
                    'has_access'   => $hasAccess,
                    'recipe_count' => $cat->recipes->count(),
                    'recipes'      => $hasAccess
                        ? $cat->recipes->map(fn ($r) => array_merge($r->toArray(), [
                            'made_count' => $madeCounts[$r->id] ?? 0,
                        ]))->values()
                        : $cat->recipes->map(fn ($r) => [
                            'id'     => $r->id,
                            'name'   => $r->name,
                            'locked' => true,
                        ])->values(),
                ];
            });

        return response()->json(['ok' => true, 'categories' => $categories]);
    }
}
