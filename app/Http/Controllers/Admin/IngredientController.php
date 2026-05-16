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
                'translationRo'    => $i->translations['ro']['name'] ?? null,
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
            'translation_ro_name' => 'nullable|string|max:100',
            'calories_per_100g' => 'nullable|numeric|min:0',
            'protein_per_100g'  => 'nullable|numeric|min:0',
            'fat_per_100g'      => 'nullable|numeric|min:0',
            'carbs_per_100g'    => 'nullable|numeric|min:0',
            'fiber_per_100g'    => 'nullable|numeric|min:0',
        ]);

        $data['translations'] = $this->roName($data);
        unset($data['translation_ro_name']);

        MasterIngredient::create($data);
        return back();
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $data = $request->validate([
            'name'              => 'sometimes|string|max:100',
            'category'          => 'sometimes|string|max:50',
            'translation_ro_name' => 'nullable|string|max:100',
            'calories_per_100g' => 'nullable|numeric|min:0',
            'protein_per_100g'  => 'nullable|numeric|min:0',
            'fat_per_100g'      => 'nullable|numeric|min:0',
            'carbs_per_100g'    => 'nullable|numeric|min:0',
            'fiber_per_100g'    => 'nullable|numeric|min:0',
        ]);

        if (array_key_exists('translation_ro_name', $data)) {
            $data['translations'] = $this->roName($data);
        }
        unset($data['translation_ro_name']);

        MasterIngredient::findOrFail($id)->update($data);
        return back();
    }

    private function roName(array $data): ?array
    {
        $ro = trim((string) ($data['translation_ro_name'] ?? ''));
        return $ro !== '' ? ['ro' => ['name' => $ro]] : null;
    }

    public function destroy(int $id): RedirectResponse
    {
        MasterIngredient::findOrFail($id)->delete();
        return back();
    }

    public function nutritionLookup(Request $request): JsonResponse
    {
        $name = $request->validate(['name' => 'required|string|max:100'])['name'];

        $response = Http::withHeaders([
            'X-Api-Key' => config('services.calorie_ninjas.key'),
        ])->get('https://api.calorieninjas.com/v1/nutrition', [
            'query' => $name,
        ]);

        if (!$response->ok()) {
            return response()->json(['error' => 'API request failed'], 502);
        }

        $items = $response->json('items', []);

        if (empty($items)) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $item = $items[0];

        return response()->json([
            'foundName' => $item['name'] ?? null,
            'calories'  => round($item['calories']               ?? 0, 1),
            'protein'   => round($item['protein_g']              ?? 0, 1),
            'fat'       => round($item['fat_total_g']            ?? 0, 1),
            'carbs'     => round($item['carbohydrates_total_g']  ?? 0, 1),
            'fiber'     => round($item['fiber_g']                ?? 0, 1),
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
