<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Recipe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
                'id'          => $r->id,
                'name'        => $r->name,
                'image'       => $r->image,
                'baseServings' => $r->base_servings,
                'ingredients' => $r->ingredients,
                'steps'       => $r->steps,
                'nutrition'   => $r->nutrition,
                'tags'        => $r->tags ?? [],
                'isActive'    => (bool) $r->is_active,
                'sortOrder'   => $r->sort_order,
                'module'      => $r->module
                    ? ['id' => $r->module->id, 'name' => $r->module->name, 'slug' => $r->module->slug]
                    : null,
            ]);

        $modules = Module::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Recipes', [
            'recipes' => $recipes,
            'modules' => $modules,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $data['id'] = (string) Str::uuid();
        Recipe::create($data);
        return back();
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        Recipe::findOrFail($id)->update($this->validatedData($request));
        return back();
    }

    public function destroy(string $id): RedirectResponse
    {
        Recipe::findOrFail($id)->delete();
        return back();
    }

    public function toggleActive(string $id): RedirectResponse
    {
        $recipe = Recipe::findOrFail($id);
        $recipe->update(['is_active' => ! $recipe->is_active]);
        return back();
    }

    private function validatedData(Request $request): array
    {
        $data = $request->validate([
            'name'               => 'required|string|max:255',
            'image'              => 'nullable|string',
            'base_servings'      => 'required|integer|min:1',
            'sort_order'         => 'required|integer|min:0',
            'is_active'          => 'boolean',
            'tags'               => 'nullable|array',
            'tags.*'             => 'string',
            'module_id'          => 'nullable|string|exists:modules,id',
            'nutrition'          => 'required|array',
            'nutrition.calories' => 'required|numeric|min:0',
            'nutrition.protein'  => 'required|numeric|min:0',
            'nutrition.fat'      => 'required|numeric|min:0',
            'nutrition.carbs'    => 'required|numeric|min:0',
            'nutrition.fiber'    => 'required|numeric|min:0',
            'ingredients'        => 'required|array|min:1',
            'ingredients.*.name'     => 'required|string',
            'ingredients.*.quantity' => 'required|numeric|min:0',
            'ingredients.*.unit'     => 'required|string',
            'ingredients.*.category' => 'required|string',
            'steps'              => 'required|array|min:1',
            'steps.*'            => 'required|string',
        ]);

        $data['image']     = $data['image'] ?? '';
        $data['module_id'] = $data['module_id'] ?: null;

        return $data;
    }
}
