<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\RecipeCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeController extends Controller
{
    public function createCheckoutSession(Request $request): \Inertia\Response|\Symfony\Component\HttpFoundation\Response
    {
        $validated = $request->validate([
            'type' => ['required', 'in:module,category'],
            'id'   => ['required', 'string'],
        ]);

        $user = $request->user();

        if ($validated['type'] === 'module') {
            $item       = Module::findOrFail($validated['id']);
            $successUrl = route('purchase') . '?stripe_success=1';
            $cancelUrl  = route('purchase') . '?stripe_canceled=1';
        } else {
            $item       = RecipeCategory::findOrFail($validated['id']);
            $successUrl = route('explore') . '?stripe_success=1';
            $cancelUrl  = route('explore') . '?stripe_canceled=1';
        }

        $stripe  = new StripeClient(config('services.stripe.secret'));
        $session = $stripe->checkout->sessions->create([
            'line_items' => [[
                'price_data' => [
                    'currency'     => 'eur',
                    'product_data' => ['name' => $item->name],
                    'unit_amount'  => (int) round($item->price * 100),
                ],
                'quantity' => 1,
            ]],
            'mode'           => 'payment',
            'customer_email' => $user->email,
            'metadata'       => [
                'user_id' => $user->id,
                'type'    => $validated['type'],
                'item_id' => $validated['id'],
            ],
            'success_url' => $successUrl,
            'cancel_url'  => $cancelUrl,
        ]);

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
        } catch (\Exception $e) {
            Log::error('Stripe webhook: semnătură invalidă — ' . $e->getMessage());
            return response('Invalid signature', 400);
        }

        if ($event->type !== 'checkout.session.completed') {
            return response('OK', 200);
        }

        $session = $event->data->object;
        $userId  = $session->metadata->user_id  ?? null;
        $type    = $session->metadata->type     ?? null;
        $itemId  = $session->metadata->item_id  ?? null;

        // Backward compat: sesiuni vechi stocau direct module_id
        if (!$type && isset($session->metadata->module_id)) {
            $type   = 'module';
            $itemId = $session->metadata->module_id;
        }

        Log::info("Stripe webhook checkout.session.completed — userId={$userId}, type={$type}, itemId={$itemId}");

        if (!$userId || !$type || !$itemId) {
            Log::warning("Stripe webhook: metadata incomplet — userId={$userId}, type={$type}, itemId={$itemId}");
            return response('OK', 200);
        }

        if ($type === 'module') {
            DB::table('user_modules')->insertOrIgnore([
                'user_id'      => $userId,
                'module_id'    => $itemId,
                'purchased_at' => now(),
            ]);
            Log::info("Stripe webhook: acces modul acordat — userId={$userId}, moduleId={$itemId}");
        } elseif ($type === 'category') {
            DB::table('user_categories')->insertOrIgnore([
                'user_id'      => $userId,
                'category_id'  => $itemId,
                'purchased_at' => now(),
            ]);
            Log::info("Stripe webhook: acces categorie acordat — userId={$userId}, categoryId={$itemId}");
        } else {
            Log::warning("Stripe webhook: tip necunoscut — type={$type}");
        }

        return response('OK', 200);
    }
}
