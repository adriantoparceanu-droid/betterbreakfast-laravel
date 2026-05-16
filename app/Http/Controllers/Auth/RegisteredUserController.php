<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\ValidHCaptcha;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', ['mode' => 'register']);
    }

    public function store(Request $request): RedirectResponse
    {
        $captchaRules = app()->environment('testing') ? [] : ['required', new ValidHCaptcha];

        // Normalizăm email + username la lowercase înainte de validare
        // Parola rămâne case-sensitive (nu o atingem)
        $request->merge([
            'email'    => Str::lower(trim($request->string('email')->value())),
            'username' => Str::lower(trim($request->string('username')->value())),
        ]);

        $request->validate([
            'email'          => 'required|string|email|max:255|unique:users',
            'username'       => 'required|string|min:2|max:30|unique:users|alpha_dash',
            'password'       => ['required', 'confirmed', Rules\Password::defaults()],
            'hcaptcha_token' => $captchaRules,
            'privacy_policy' => 'accepted',
        ]);

        $user = User::create([
            'email'    => $request->email,
            'username' => $request->username,
            'password' => $request->password,
        ]);

        event(new Registered($user));

        Auth::login($user);
        $request->session()->regenerate();
        $token = Str::uuid()->toString();
        $user->update(['current_session_id' => $token]);

        $cookie = cookie('bb_device_id', $token, 60 * 24 * 365 * 10, '/', null, config('session.secure', false), true, false, 'lax');

        return redirect()->route('purchase')->withCookie($cookie);
    }
}
