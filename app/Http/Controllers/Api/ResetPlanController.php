<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResetPlanController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user     = $request->user();
        $servings = $user->progress?->default_servings ?? 1;

        UserProgress::updateOrCreate(
            ['user_id' => $user->id],
            [
                'current_day'        => 1,
                'completed_days'     => [],
                'selected_recipes'   => [],
                'used_recipe_ids'    => [],
                'check_ins'          => [],
                'pantry_checked'     => [],
                'foundation_checked' => [],
                'foundation_done'    => false,
                'default_servings'   => $servings,
            ]
        );

        return response()->json(['ok' => true]);
    }
}
