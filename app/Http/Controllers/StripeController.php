<?php

namespace App\Http\Controllers;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeController extends Controller
{
    public function createCheckoutSession(Request $request): \Inertia\Response|\Symfony\Component\HttpFoundation\Response
    {
        $user   = $request->user();
        $module = Module::where('slug', 'breakfast-10-day')->firstOrFail();

        $stripe  = new StripeClient(config('services.stripe.secret'));
        $session = $stripe->checkout->sessions->create([
            'line_items' => [[
                'price_data' => [
                    'currency'     => 'eur',
                    'product_data' => ['name' => $module->name],
                    'unit_amount'  => (int) round($module->price * 100),
                ],
                'quantity' => 1,
            ]],
            'mode'           => 'payment',
            'customer_email' => $user->email,
            'metadata'       => [
                'user_id'   => $user->id,
                'module_id' => $module->id,
            ],
            'success_url' => route('purchase') . '?stripe_success=1',
            'cancel_url'  => route('purchase') . '?stripe_canceled=1',
        ]);

        // Inertia::location triggers window.location redirect (works with Inertia XHR)
        return Inertia::location($session->url);
    }

    public function webhook(Request $request): Response
    {
        $payload   = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent(
                $payload,
                $signature,
                config('services.stripe.webhook_secret'),
            );
        } catch (\Exception) {
            return response('Invalid signature', 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session  = $event->data->object;
            $userId   = $session->metadata->user_id ?? null;
            $moduleId = $session->metadata->module_id ?? null;

            if ($userId && $moduleId) {
                DB::table('user_modules')->insertOrIgnore([
                    'user_id'      => $userId,
                    'module_id'    => $moduleId,
                    'purchased_at' => now(),
                ]);
            }
        }

        return response('OK', 200);
    }
}
