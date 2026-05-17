<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UiTranslation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class UiTranslationController extends Controller
{
    public function index(): Response
    {
        $translations = UiTranslation::orderBy('locale')
            ->orderBy('key')
            ->get(['id', 'locale', 'key', 'value', 'updated_at']);

        return Inertia::render('Admin/Translations', [
            'translations' => $translations,
        ]);
    }

    public function update(Request $request, UiTranslation $uiTranslation): JsonResponse
    {
        $request->validate(['value' => 'required|string|max:5000']);

        $uiTranslation->update(['value' => $request->input('value')]);
        Cache::forget('ui_translations');

        return response()->json(['ok' => true]);
    }
}
