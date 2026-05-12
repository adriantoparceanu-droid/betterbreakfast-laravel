<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MasterIngredient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientController extends Controller
{
    public function index(): Response
    {
        $ingredients = MasterIngredient::orderBy('name')
            ->get()
            ->map(fn ($i) => [
                'id'       => $i->id,
                'name'     => $i->name,
                'category' => $i->category,
                'unit'     => $i->unit,
                'notes'    => $i->notes,
            ]);

        return Inertia::render('Admin/Ingredients', ['ingredients' => $ingredients]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:100|unique:master_ingredients,name',
            'category' => 'required|string|max:50',
            'unit'     => 'required|string|max:30',
            'notes'    => 'nullable|string|max:300',
        ]);

        MasterIngredient::create($data);
        return back();
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $data = $request->validate([
            'name'     => 'sometimes|string|max:100',
            'category' => 'sometimes|string|max:50',
            'unit'     => 'sometimes|string|max:30',
            'notes'    => 'nullable|string|max:300',
        ]);

        MasterIngredient::findOrFail($id)->update($data);
        return back();
    }

    public function destroy(int $id): RedirectResponse
    {
        MasterIngredient::findOrFail($id)->delete();
        return back();
    }
}
