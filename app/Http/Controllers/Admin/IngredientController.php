<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MasterIngredient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class IngredientController extends Controller
{
    public function index(): Response
    {
        $ingredients = MasterIngredient::orderBy('name')
            ->get()
            ->map(fn ($i) => [
                'id'               => $i->id,
                'name'             => $i->name,
                'category'         => $i->category,
                'caloriesPer100g'  => $i->calories_per_100g,
                'proteinPer100g'   => $i->protein_per_100g,
                'fatPer100g'       => $i->fat_per_100g,
                'carbsPer100g'     => $i->carbs_per_100g,
                'fiberPer100g'     => $i->fiber_per_100g,
            ]);

        return Inertia::render('Admin/Ingredients', ['ingredients' => $ingredients]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'              => 'required|string|max:100|unique:master_ingredients,name',
            'category'          => 'required|string|max:50',
            'calories_per_100g' => 'nullable|numeric|min:0',
            'protein_per_100g'  => 'nullable|numeric|min:0',
            'fat_per_100g'      => 'nullable|numeric|min:0',
            'carbs_per_100g'    => 'nullable|numeric|min:0',
            'fiber_per_100g'    => 'nullable|numeric|min:0',
        ]);

        MasterIngredient::create($data);
        return back();
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $data = $request->validate([
            'name'              => 'sometimes|string|max:100',
            'category'          => 'sometimes|string|max:50',
            'calories_per_100g' => 'nullable|numeric|min:0',
            'protein_per_100g'  => 'nullable|numeric|min:0',
            'fat_per_100g'      => 'nullable|numeric|min:0',
            'carbs_per_100g'    => 'nullable|numeric|min:0',
            'fiber_per_100g'    => 'nullable|numeric|min:0',
        ]);

        MasterIngredient::findOrFail($id)->update($data);
        return back();
    }

    public function destroy(int $id): RedirectResponse
    {
        MasterIngredient::findOrFail($id)->delete();
        return back();
    }

    public function nutritionLookup(Request $request): JsonResponse
    {
        $name = $request->validate(['name' => 'required|string|max:100'])['name'];

        $response = Http::get('https://api.nal.usda.gov/fdc/v1/foods/search', [
            'query'    => $name,
            'dataType' => 'Foundation,SR Legacy',
            'pageSize' => 1,
            'api_key'  => config('services.usda_fdc.key'),
        ]);

        if (!$response->ok()) {
            return response()->json(['error' => 'API request failed'], 502);
        }

        $foods = $response->json('foods', []);

        if (empty($foods)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $nutrients = collect($foods[0]['foodNutrients'] ?? []);
        $get = fn (int $id) => round($nutrients->firstWhere('nutrientId', $id)['value'] ?? 0, 1) ?: null;

        return response()->json([
            'foundName' => $foods[0]['description'] ?? null,
            'calories'  => $get(1008),
            'protein'   => $get(1003),
            'fat'       => $get(1004),
            'carbs'     => $get(1005),
            'fiber'     => $get(1079),
        ]);
    }

    public function seedFromRecipes(): RedirectResponse
    {
        $existing = MasterIngredient::pluck('name')->map(fn ($n) => strtolower($n))->toArray();

        $recipes = \App\Models\Recipe::all(['ingredients']);
        $toInsert = [];

        foreach ($recipes as $recipe) {
            foreach ($recipe->ingredients as $ing) {
                $nameLower = strtolower(trim($ing['name']));
                if (!in_array($nameLower, $existing)) {
                    $existing[]   = $nameLower;
                    $toInsert[] = [
                        'name'       => trim($ing['name']),
                        'category'   => $ing['category'] ?? 'Condiments',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        if (!empty($toInsert)) {
            MasterIngredient::insert($toInsert);
        }

        return back();
    }
}
