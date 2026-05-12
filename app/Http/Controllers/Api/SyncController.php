<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type'    => 'required|string',
            'payload' => 'required|array',
        ]);

        if ($request->type === 'PROGRESS_UPDATE') {
            $payload = $request->payload;

            $map = [
                'completedDays'     => 'completed_days',
                'selectedRecipes'   => 'selected_recipes',
                'checkIns'          => 'check_ins',
                'pantryChecked'     => 'pantry_checked',
                'currentDay'        => 'current_day',
                'defaultServings'   => 'default_servings',
                'foundationChecked' => 'foundation_checked',
                'foundationDone'    => 'foundation_done',
                'usedRecipeIds'     => 'used_recipe_ids',
            ];

            $data = [];
            foreach ($map as $jsKey => $dbKey) {
                if (array_key_exists($jsKey, $payload)) {
                    $data[$dbKey] = $payload[$jsKey];
                }
            }

            if (! empty($data)) {
                UserProgress::updateOrCreate(
                    ['user_id' => $request->user()->id],
                    $data,
                );
            }
        }

        return response()->json(['ok' => true]);
    }
}
