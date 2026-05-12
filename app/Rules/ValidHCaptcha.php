<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

class ValidHCaptcha implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            $fail('Please complete the CAPTCHA.');
            return;
        }

        $response = Http::asForm()->post('https://api.hcaptcha.com/siteverify', [
            'secret'   => config('services.hcaptcha.secret'),
            'response' => $value,
        ]);

        if (! $response->successful() || ! $response->json('success', false)) {
            $fail('CAPTCHA verification failed. Please try again.');
        }
    }
}
