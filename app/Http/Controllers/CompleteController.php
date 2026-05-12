<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class CompleteController extends Controller
{
    public function show(int $day): Response
    {
        return Inertia::render('Complete', ['day' => $day]);
    }
}
