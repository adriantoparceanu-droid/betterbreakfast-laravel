<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class NutritionController extends Controller
{
    public function calculate(Request $request): JsonResponse
    {
        $request->validate([
            'ingredients'          => 'required|array|min:1',
            'ingredients.*.name'   => 'required|string',
            'ingredients.*.quantity' => 'required|numeric',
            'ingredients.*.unit'   => 'required|string',
            'base_servings'        => 'required|integer|min:1',
        ]);

        $ingredients  = $request->input('ingredients');
        $baseServings = (int) $request->input('base_servings');

        $ingredientList = collect($ingredients)
            ->filter(fn ($i) => !empty(trim($i['name'])))
            ->map(fn ($i) => "{$i['quantity']} {$i['unit']} {$i['name']}")
            ->implode("\n");

        if (empty($ingredientList)) {
            return response()->json(['error' => 'No valid ingredients provided.'], 422);
        }

        $schema = [
            'type' => 'object',
            'properties' => [
                'ingrediente_procesate' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'nume'                 => ['type' => 'string'],
                            'cantitate_originala'  => ['type' => 'string'],
                            'gramaj_estimat_grame' => ['type' => 'number'],
                            'calorii'              => ['type' => 'number'],
                            'proteine'             => ['type' => 'number'],
                            'carbohidrati'         => ['type' => 'number'],
                            'grasimi'              => ['type' => 'number'],
                            'fibre'                => ['type' => 'number'],
                        ],
                        'required' => ['nume', 'cantitate_originala', 'gramaj_estimat_grame', 'calorii', 'proteine', 'carbohidrati', 'grasimi', 'fibre'],
                    ],
                ],
                'total_reteta' => [
                    'type' => 'object',
                    'properties' => [
                        'calorii'      => ['type' => 'number'],
                        'proteine'     => ['type' => 'number'],
                        'carbohidrati' => ['type' => 'number'],
                        'grasimi'      => ['type' => 'number'],
                        'fibre'        => ['type' => 'number'],
                    ],
                    'required' => ['calorii', 'proteine', 'carbohidrati', 'grasimi', 'fibre'],
                ],
            ],
            'required' => ['ingrediente_procesate', 'total_reteta'],
        ];

        $systemInstruction = 'You are a precision nutritionist and mathematical converter. '
            . 'Your role is to take a raw ingredient list, convert any non-standard units (ml, tbsp, tsp, cup, piece, whole, handful, oz, lb, etc.) '
            . 'to grams based on the standard density of each food, '
            . 'then calculate calories, protein, carbohydrates, fat, and fiber using the USDA food database. '
            . 'Return ONLY valid JSON matching the schema — no markdown, no extra text.';

        $apiKey  = config('services.gemini.key');
        $url     = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";

        $response = Http::timeout(30)->post($url, [
            'system_instruction' => [
                'parts' => [['text' => $systemInstruction]],
            ],
            'contents' => [
                [
                    'parts' => [[
                        'text' => "Calculate nutritional values for the following ingredients:\n\n{$ingredientList}",
                    ]],
                ],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'responseSchema'   => $schema,
            ],
        ]);

        if (! $response->successful()) {
            return response()->json(['error' => 'Gemini API error: ' . $response->status()], 502);
        }

        $text = $response->json('candidates.0.content.parts.0.text');

        if (! $text) {
            return response()->json(['error' => 'Empty response from Gemini.'], 502);
        }

        $data = json_decode($text, true);

        if (! $data || ! isset($data['total_reteta'])) {
            return response()->json(['error' => 'Invalid response structure from Gemini.'], 502);
        }

        $total = $data['total_reteta'];
        $round = fn ($v) => round($v / $baseServings, 1);

        return response()->json([
            'per_serving' => [
                'calories' => $round($total['calorii']),
                'protein'  => $round($total['proteine']),
                'fat'      => $round($total['grasimi']),
                'carbs'    => $round($total['carbohidrati']),
                'fiber'    => $round($total['fibre']),
            ],
            'ingredients_detail' => array_map(fn ($i) => [
                'name'     => $i['nume'],
                'original' => $i['cantitate_originala'],
                'grams'    => $i['gramaj_estimat_grame'],
                'calories' => $i['calorii'],
                'protein'  => $i['proteine'],
                'fat'      => $i['grasimi'],
                'carbs'    => $i['carbohidrati'],
                'fiber'    => $i['fibre'],
            ], $data['ingrediente_procesate'] ?? []),
        ]);
    }
}
