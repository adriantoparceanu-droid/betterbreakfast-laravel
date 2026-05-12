<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use App\Models\User;
use App\Models\UserModule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $totalUsers      = User::where('role', 'user')->count();
        $usersWithAccess = UserModule::whereHas('module', fn ($q) => $q->where('slug', 'breakfast-10-day'))->count();
        $completions     = AnalyticsEvent::where('event', 'COMPLETE_DAY')->count();
        $swaps           = AnalyticsEvent::where('event', 'SWAP_RECIPE')->count();

        $recentEvents = AnalyticsEvent::orderByDesc('created_at')
            ->take(8)
            ->get(['id', 'event', 'anonymous_id', 'created_at'])
            ->map(fn ($e) => [
                'id'          => $e->id,
                'event'       => $e->event,
                'anonymousId' => $e->anonymous_id,
                'createdAt'   => $e->created_at->toIso8601String(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => compact('totalUsers', 'usersWithAccess', 'completions', 'swaps'),
            'recentEvents' => $recentEvents,
        ]);
    }
}
