<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class SwapController extends Controller
{
    public function show(int $day): Response
    {
        return Inertia::render('Swap', ['day' => $day]);
    }
}
