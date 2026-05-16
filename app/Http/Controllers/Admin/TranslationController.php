<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TranslationController extends Controller
{
    // Generates a Romanian translation of admin content via Gemini.
    // EN stays the source of truth; the admin reviews/edits before saving.
    public function translate(Request $request): JsonResponse
    {
        $request->validate([
            'type'    => 'required|string|in:recipe,ingredient,category,module,field,list',
            'payload' => 'required|array',
        ]);

        $type    = $request->input('type');
        $payload = $request->input('payload');

        [$schema, $instruction] = $this->schemaFor($type);

        $apiKey = config('services.gemini.key');
        if (! $apiKey) {
            return response()->json(['error' => 'Gemini API key not configured.'], 500);
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";

        $response = Http::timeout(45)->post($url, [
            'system_instruction' => ['parts' => [['text' => $instruction]]],
            'contents' => [[
                'parts' => [['text' => "Translate this JSON content to Romanian:\n\n" . json_encode($payload, JSON_UNESCAPED_UNICODE)]],
            ]],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'responseSchema'   => $schema,
            ],
        ]);

        if (! $response->successful()) {
            return response()->json(['error' => 'Gemini API error: ' . $response->status()], 502);
        }

        $text = $response->json('candidates.0.content.parts.0.text');
        $data = $text ? json_decode($text, true) : null;

        if (! is_array($data)) {
            return response()->json(['error' => 'Invalid response from Gemini.'], 502);
        }

        return response()->json(['ok' => true, 'translation' => $data]);
    }

    /** @return array{0: array, 1: string} */
    private function schemaFor(string $type): array
    {
        $base = 'You are a professional culinary translator from English to Romanian, '
            . 'translating content for a Romanian breakfast app. Translate naturally and '
            . 'idiomatically for a Romanian cooking audience. Keep all numbers, quantities '
            . 'and units unchanged. Preserve any HTML tags exactly — translate only the '
            . 'human-readable text between tags. Return ONLY valid JSON matching the schema.';

        return match ($type) {
            'recipe' => [[
                'type' => 'object',
                'properties' => [
                    'name'          => ['type' => 'string'],
                    'ingredients'   => [
                        'type'  => 'array',
                        'items' => [
                            'type'       => 'object',
                            'properties' => ['name' => ['type' => 'string']],
                            'required'   => ['name'],
                        ],
                    ],
                    'steps'         => ['type' => 'array', 'items' => ['type' => 'string']],
                    'substitutions' => ['type' => 'string'],
                    'whyThisWorks'  => ['type' => 'string'],
                ],
                'required' => ['name', 'ingredients', 'steps'],
            ], $base . ' Keep the ingredients array in the SAME ORDER as the input.'],

            'ingredient' => [[
                'type'       => 'object',
                'properties' => ['name' => ['type' => 'string']],
                'required'   => ['name'],
            ], $base],

            'field' => [[
                'type'       => 'object',
                'properties' => ['text' => ['type' => 'string']],
                'required'   => ['text'],
            ], $base],

            'list' => [[
                'type'       => 'object',
                'properties' => ['items' => ['type' => 'array', 'items' => ['type' => 'string']]],
                'required'   => ['items'],
            ], $base . ' Keep the items array in the SAME ORDER and SAME LENGTH as the input.'],

            default => [[ // category & module: name + description
                'type'       => 'object',
                'properties' => [
                    'name'        => ['type' => 'string'],
                    'description' => ['type' => 'string'],
                ],
                'required' => ['name'],
            ], $base],
        };
    }
}
