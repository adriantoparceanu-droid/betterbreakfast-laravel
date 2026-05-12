<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return $next($request);
        }

        $hasAccess = $user->modules()
            ->where('slug', 'breakfast-10-day')
            ->exists();

        if (! $hasAccess) {
            return redirect()->route('purchase');
        }

        return $next($request);
    }
}
