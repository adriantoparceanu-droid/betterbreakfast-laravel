<?php

namespace App\Http\Middleware;

use App\Models\RecipeCategory;
use App\Models\UiTranslation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'hcaptcha_site_key' => config('services.hcaptcha.site_key'),
            'uiTranslations' => static function () {
                return Cache::remember('ui_translations', 3600, function () {
                    return UiTranslation::all()
                        ->mapWithKeys(fn ($t) => ["{$t->locale}.{$t->key}" => $t->value])
                        ->all();
                });
            },
            'adminNavCategories' => static function () use ($request) {
                if (! $request->user()?->isAdmin()) {
                    return [];
                }
                return RecipeCategory::orderBy('sort_order')
                    ->get(['id', 'name', 'is_active'])
                    ->map(fn ($c) => [
                        'id'       => $c->id,
                        'name'     => $c->name,
                        'isActive' => (bool) $c->is_active,
                    ])
                    ->all();
            },
        ];
    }
}
