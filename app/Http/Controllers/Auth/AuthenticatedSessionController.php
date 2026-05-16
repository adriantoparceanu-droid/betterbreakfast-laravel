<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'mode'   => 'login',
            'status' => session('status'),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = Auth::user();
        $token = Str::uuid()->toString();
        $user->update(['current_session_id' => $token]);

        $cookie = cookie('bb_device_id', $token, 60 * 24 * 365 * 10, '/', null, config('session.secure', false), true, false, 'lax');

        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard')->withCookie($cookie);
        }

        return redirect()->route('today')->withCookie($cookie);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();
        if ($user) {
            $user->update(['current_session_id' => null]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->withoutCookie('bb_device_id');
    }
}
