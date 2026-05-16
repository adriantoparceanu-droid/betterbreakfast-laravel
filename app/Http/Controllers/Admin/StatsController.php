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

        // Explore stats
        $exploreEvents       = AnalyticsEvent::where('event', 'EXPLORE_MADE_THIS')->get(['properties']);
        $exploreByCategoryId = [];
        $exploreByRecipeId   = [];

        foreach ($exploreEvents as $e) {
            $props = is_array($e->properties) ? $e->properties : (json_decode($e->properties, true) ?? []);
            if ($rid = $props['recipeId']   ?? null) $exploreByRecipeId[$rid]   = ($exploreByRecipeId[$rid]   ?? 0) + 1;
            if ($cid = $props['categoryId'] ?? null) {
                $catName = $props['categoryName'] ?? $cid;
                $exploreByCategoryId[$cid] = [
                    'name'  => $catName,
                    'count' => (($exploreByCategoryId[$cid]['count'] ?? 0) + 1),
                ];
            }
        }

        arsort($exploreByRecipeId);
        $topExploreRecipes = [];
        foreach (array_slice($exploreByRecipeId, 0, 10, true) as $id => $count) {
            $topExploreRecipes[] = ['id' => $id, 'name' => $nameOf[$id] ?? $id, 'count' => $count];
        }

        usort($exploreByCategoryId, fn ($a, $b) => $b['count'] - $a['count']);
        $exploreByCategory = array_values($exploreByCategoryId);

        return Inertia::render('Admin/Stats', [
            'completionsByDay'   => $completionsByDay,
            'topCompleted'       => $topCompleted,
            'topSwappedTo'       => $topSwappedTo,
            'topSwappedFrom'     => $topSwappedFrom,
            'totalCompletions'   => count($completionEvents),
            'totalSwaps'         => count($swapEvents),
            'totalExploreMades'  => count($exploreEvents),
            'topExploreRecipes'  => $topExploreRecipes,
            'exploreByCategory'  => $exploreByCategory,
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
