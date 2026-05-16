<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\RecipeCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = RecipeCategory::with('module:id,name')
            ->withCount('recipes')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($c) => [
                'id'           => $c->id,
                'name'         => $c->name,
                'slug'         => $c->slug,
                'description'  => $c->description,
                'translations' => $c->translations ?: null,
                'price'        => $c->price,
                'sortOrder'    => $c->sort_order,
                'isActive'     => $c->is_active,
                'recipesCount' => $c->recipes_count,
                'module'       => $c->module ? ['id' => $c->module->id, 'name' => $c->module->name] : null,
            ]);

        $modules = Module::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Categories', [
            'categories' => $categories,
            'modules'    => $modules,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'module_id'   => 'required|string|exists:modules,id',
            'description' => 'nullable|string|max:500',
            'price'       => 'required|numeric|min:0',
            'sort_order'  => 'integer|min:0',
        ]);

        $data['id']       = 'cat-' . Str::slug($data['name']) . '-' . Str::random(4);
        $data['slug']     = Str::slug($data['name']);
        $data['is_active'] = true;

        RecipeCategory::create($data);

        return back();
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'price'       => 'required|numeric|min:0',
            'sort_order'  => 'integer|min:0',
            'translations'                => 'nullable|array',
            'translations.ro'             => 'nullable|array',
            'translations.ro.name'        => 'nullable|string',
            'translations.ro.description' => 'nullable|string',
        ]);

        if (array_key_exists('translations', $data)) {
            $ro = array_filter($data['translations']['ro'] ?? [], fn ($v) => $v !== null && $v !== '');
            $data['translations'] = $ro ? ['ro' => $ro] : null;
        }

        RecipeCategory::findOrFail($id)->update($data);

        return back();
    }

    public function toggleActive(string $id): RedirectResponse
    {
        $cat = RecipeCategory::findOrFail($id);
        $cat->update(['is_active' => !$cat->is_active]);

        return back();
    }

    public function destroy(string $id): RedirectResponse
    {
        RecipeCategory::findOrFail($id)->delete();

        return back();
    }
}
