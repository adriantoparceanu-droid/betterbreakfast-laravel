<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PagesController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Pages', [
            'privacy_policy' => SiteSetting::get('privacy_policy', ''),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate(['privacy_policy' => 'nullable|string']);
        SiteSetting::set('privacy_policy', $request->privacy_policy ?? '');
        return back()->with('success', 'Saved.');
    }
}
