<?php

namespace App\Http\Controllers;

use App\Models\UserProgress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $progress = $request->user()->progress;

        if ($progress && $progress->current_day > 1) {
            return redirect()->route('today');
        }

        return Inertia::render('Onboarding');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'defaultServings' => 'required|integer|min:1|max:8',
        ]);

        UserProgress::updateOrCreate(
            ['user_id' => $request->user()->id],
            ['default_servings' => $request->defaultServings, 'foundation_done' => true],
        );

        return redirect()->route('staples');
    }
}
