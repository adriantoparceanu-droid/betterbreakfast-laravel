<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnsureSingleDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->isAdmin()) {
            return $next($request);
        }

        $deviceToken = $request->cookie('bb_device_id');

        // Admin forced re-login (sentinel value set by admin panel)
        if ($user->current_session_id === '__admin_reset__') {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Session reset by administrator.'], 401);
            }
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')
                ->with('status', 'Your session was reset. Please log in again.')
                ->withoutCookie('bb_device_id');
        }

        // No cookie, no registered device → first access, register this device
        if (! $deviceToken && ! $user->current_session_id) {
            $token = Str::uuid()->toString();
            $user->update(['current_session_id' => $token]);
            return $next($request)->withCookie(
                cookie('bb_device_id', $token, 60 * 24 * 365 * 10, '/', null, config('session.secure', false), true, false, 'lax')
            );
        }

        // Cookie present but no DB record (edge case after admin clear) → register it
        if ($deviceToken && ! $user->current_session_id) {
            $user->update(['current_session_id' => $deviceToken]);
            return $next($request);
        }

        // Cookie missing but device is registered → wrong device or cleared cookies
        if (! $deviceToken) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Account active on another device.'], 401);
            }
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')
                ->with('status', 'Your account is active on another device. Log out there first.');
        }

        // Token mismatch → different device
        if ($user->current_session_id !== $deviceToken) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Account active on another device.'], 401);
            }
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')
                ->with('status', 'Your account is active on another device. Log out there first.');
        }

        return $next($request);
    }
}
