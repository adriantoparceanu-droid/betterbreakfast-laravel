<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'events'               => 'required|array',
            'events.*.anonymousId' => 'required|string',
            'events.*.event'       => 'required|in:COMPLETE_DAY,SWAP_RECIPE,EXPLORE_MADE_THIS',
            'events.*.properties'  => 'sometimes|array',
        ]);

        $userId = $request->user()?->id;

        $rows = array_map(fn ($e) => [
            'user_id'      => $userId,
            'anonymous_id' => $e['anonymousId'],
            'event'        => $e['event'],
            'properties'   => json_encode($e['properties'] ?? []),
        ], $request->events);

        AnalyticsEvent::insert($rows);

        return response()->json(['ok' => true]);
    }
}
