<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use App\Models\Recipe;
use Inertia\Inertia;
use Inertia\Response;

class StatsController extends Controller
{
    public function index(): Response
    {
        $completionEvents = AnalyticsEvent::where('event', 'COMPLETE_DAY')->get(['properties']);
        $swapEvents       = AnalyticsEvent::where('event', 'SWAP_RECIPE')->get(['properties']);

        $completionsByDay  = [];
        $recipeCompletions = [];

        foreach ($completionEvents as $e) {
            $props = is_array($e->properties) ? $e->properties : (json_decode($e->properties, true) ?? []);
            $day   = $props['dayNumber'] ?? 0;
            $completionsByDay[$day] = ($completionsByDay[$day] ?? 0) + 1;
            if ($recipeId = $props['fromRecipeId'] ?? null) {
                $recipeCompletions[$recipeId] = ($recipeCompletions[$recipeId] ?? 0) + 1;
            }
        }

        $recipeSwapsTo   = [];
        $recipeSwapsFrom = [];

        foreach ($swapEvents as $e) {
            $props = is_array($e->properties) ? $e->properties : (json_decode($e->properties, true) ?? []);
            if ($to   = $props['toRecipeId']   ?? null) $recipeSwapsTo[$to]     = ($recipeSwapsTo[$to]     ?? 0) + 1;
            if ($from = $props['fromRecipeId'] ?? null) $recipeSwapsFrom[$from] = ($recipeSwapsFrom[$from] ?? 0) + 1;
        }

        $nameOf = Recipe::pluck('name', 'id')->toArray();

        $topCompleted   = $this->topN($recipeCompletions,  $nameOf, 10);
        $topSwappedTo   = $this->topN($recipeSwapsTo,      $nameOf, 10);
        $topSwappedFrom = $this->topN($recipeSwapsFrom,    $nameOf, 10);

        return Inertia::render('Admin/Stats', [
            'completionsByDay'  => $completionsByDay,
            'topCompleted'      => $topCompleted,
            'topSwappedTo'      => $topSwappedTo,
            'topSwappedFrom'    => $topSwappedFrom,
            'totalCompletions'  => count($completionEvents),
            'totalSwaps'        => count($swapEvents),
        ]);
    }

    private function topN(array $counts, array $nameOf, int $n): array
    {
        arsort($counts);
        $result = [];
        foreach (array_slice($counts, 0, $n, true) as $id => $count) {
            $result[] = ['id' => $id, 'name' => $nameOf[$id] ?? $id, 'count' => $count];
        }
        return $result;
    }
}
