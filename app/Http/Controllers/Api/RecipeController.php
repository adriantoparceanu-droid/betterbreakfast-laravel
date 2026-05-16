<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;

class RecipeController extends Controller
{
    public function index(): JsonResponse
    {
        $recipes = Recipe::where('is_active', true)
            ->where('module_id', 'module-breakfast-10day')
            ->orderBy('sort_order')
            ->get(['id', 'name', 'image', 'base_servings', 'ingredients', 'steps', 'nutrition', 'tags', 'substitutions', 'why_this_works', 'translations'])
            ->map(fn ($r) => [
                'id'            => $r->id,
                'name'          => $r->name,
                'image'         => $r->image,
                'baseServings'  => $r->base_servings,
                'ingredients'   => $r->ingredients,
                'steps'         => $r->steps,
                'nutrition'     => $r->nutrition,
                'tags'          => $r->tags ?? [],
                'substitutions' => $r->substitutions ?: null,
                'whyThisWorks'  => $r->why_this_works ?: null,
                'translations'  => $r->translations ?: null,
            ]);

        return response()->json(['ok' => true, 'recipes' => $recipes]);
    }
}
