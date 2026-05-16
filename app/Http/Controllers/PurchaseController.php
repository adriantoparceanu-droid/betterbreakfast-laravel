<?php

namespace App\Http\Controllers;

use App\Models\Module;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin() || $user->modules()->where('slug', 'breakfast-10-day')->exists()) {
            $onboardingDone = $user->progress !== null;
            return redirect()->route($onboardingDone ? 'staples' : 'onboarding');
        }

        $module = Module::where('slug', 'breakfast-10-day')->firstOrFail();

        $stripeStatus = match (true) {
            $request->has('stripe_success')  => 'success',
            $request->has('stripe_canceled') => 'canceled',
            default                          => null,
        };

        return Inertia::render('Purchase', [
            'module' => [
                'id'          => $module->id,
                'name'        => $module->name,
                'description' => $module->description,
                'price'       => $module->price,
            ],
            'stripeStatus' => $stripeStatus,
        ]);
    }
}
