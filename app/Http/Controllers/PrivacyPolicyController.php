<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Inertia\Inertia;
use Inertia\Response;

class PrivacyPolicyController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('PrivacyPolicy', [
            'content' => SiteSetting::get('privacy_policy', ''),
        ]);
    }
}
