<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $progress = UserProgress::where('user_id', $request->user()->id)->first();

        if (! $progress) {
            return response()->json(['data' => null, 'forceReset' => false]);
        }

        $forceReset = $progress->force_reset;

        if ($forceReset) {
            $progress->update(['force_reset' => false]);
        }

        return response()->json([
            'data' => [
                'currentDay'       => $progress->current_day,
                'completedDays'    => $progress->completed_days    ?? [],
                'selectedRecipes'  => $progress->selected_recipes  ?? [],
                'usedRecipeIds'    => $progress->used_recipe_ids   ?? [],
                'checkIns'         => $progress->check_ins         ?? [],
                'pantryChecked'    => $progress->pantry_checked    ?? [],
                'defaultServings'  => $progress->default_servings,
                'foundationChecked'=> $progress->foundation_checked ?? [],
                'foundationDone'   => $progress->foundation_done,
            ],
            'forceReset' => $forceReset,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $allowed = [
            'currentDay', 'completedDays', 'selectedRecipes', 'usedRecipeIds',
            'checkIns', 'pantryChecked', 'defaultServings', 'foundationChecked', 'foundationDone',
        ];

        $map = [
            'currentDay'        => 'current_day',
            'completedDays'     => 'completed_days',
            'selectedRecipes'   => 'selected_recipes',
            'usedRecipeIds'     => 'used_recipe_ids',
            'checkIns'          => 'check_ins',
            'pantryChecked'     => 'pantry_checked',
            'defaultServings'   => 'default_servings',
            'foundationChecked' => 'foundation_checked',
            'foundationDone'    => 'foundation_done',
        ];

        $data = [];
        foreach ($allowed as $key) {
            if ($request->has($key)) {
                $data[$map[$key]] = $request->input($key);
            }
        }

        if (! empty($data)) {
            UserProgress::updateOrCreate(
                ['user_id' => $request->user()->id],
                $data,
            );
        }

        return response()->json(['ok' => true]);
    }
}
