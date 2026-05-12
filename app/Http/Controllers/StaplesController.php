<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class StaplesController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Staples');
    }
}
