<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\ValidHCaptcha;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        $request->validate([
            'email'          => 'required|string|lowercase|email|max:255|unique:users',
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

        return redirect()->route('onboarding');
    }
}
