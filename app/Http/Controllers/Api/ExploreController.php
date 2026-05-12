<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecipeCategory;
use Illuminate\Http\JsonResponse;

class ExploreController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();
        $unlockedIds = $user->categories()->pluck('recipe_categories.id')->toArray();

        $categories = RecipeCategory::where('is_active', true)
            ->with(['recipes' => function ($q) {
                $q->where('is_active', true)
                  ->orderBy('sort_order')
                  ->select('id', 'name', 'image', 'base_servings', 'ingredients', 'steps', 'nutrition', 'tags', 'category_id', 'sort_order');
            }])
            ->orderBy('sort_order')
            ->get()
            ->map(function ($cat) use ($unlockedIds) {
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
                        ? $cat->recipes->values()
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
