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
            return redirect()->route('staples');
        }

        $module = Module::where('slug', 'breakfast-10-day')->firstOrFail();

        return Inertia::render('Purchase', [
            'module' => [
                'name'        => $module->name,
                'description' => $module->description,
                'price'       => $module->price,
            ],
        ]);
    }
}
