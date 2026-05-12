<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Recipe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecipeController extends Controller
{
    public function index(): Response
    {
        $recipes = Recipe::with('module:id,name,slug')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($r) => [
                'id'        => $r->id,
                'name'      => $r->name,
                'nutrition' => $r->nutrition,
                'tags'      => $r->tags,
                'isActive'  => (bool) $r->is_active,
                'sortOrder' => $r->sort_order,
                'module'    => $r->module ? ['name' => $r->module->name, 'slug' => $r->module->slug] : null,
            ]);

        return Inertia::render('Admin/Recipes', ['recipes' => $recipes]);
    }

    public function toggleActive(string $id): RedirectResponse
    {
        $recipe = Recipe::findOrFail($id);
        $recipe->update(['is_active' => ! $recipe->is_active]);
        return back();
    }
}
