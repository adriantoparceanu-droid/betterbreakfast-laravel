<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ExploreController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Explore');
    }
}
