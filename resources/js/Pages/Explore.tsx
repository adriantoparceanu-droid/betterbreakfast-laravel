import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';

interface Recipe {
    id: string;
    name: string;
    image?: string;
    base_servings?: number;
    nutrition?: { calories: number; protein: number; fat: number; carbs: number; fiber: number };
    tags?: string[];
    locked?: boolean;
    made_count?: number;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    has_access: boolean;
    recipe_count: number;
    recipes: Recipe[];
}

function LockIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function UnlockModal({ category, onClose }: { category: Category; onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = () => {
        setLoading(true);
        router.post(route('purchase.checkout'), { type: 'category', id: category.id }, {
            onError: () => setLoading(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                        <LockIcon />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
                        <p className="text-sm text-brand-600 font-semibold">€{category.price.toFixed(2)}</p>
                    </div>
                </div>
                {category.description && (
                    <p className="text-sm text-gray-500 mb-4">{category.description}</p>
                )}
                <p className="text-sm text-gray-500 mb-6">
                    This collection includes <strong>{category.recipe_count} recipes</strong> available instantly after purchase.
                </p>
                <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none gap-2 mb-3"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Redirecting to Stripe…
                        </>
                    ) : (
                        `Unlock ${category.name} — €${category.price.toFixed(2)}`
                    )}
                </button>
                <p className="text-xs text-gray-500 text-center mb-4">
                    Secure payment via Stripe. One-time charge, no subscription.
                </p>
                <button onClick={onClose} className="block w-full text-center py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                    Maybe later
                </button>
            </div>
        </div>
    );
}

function RecipeCard({ recipe, locked }: { recipe: Recipe; locked: boolean }) {
    if (locked) {
        return (
            <div className="relative bg-white border border-gray-100 rounded-2xl p-4 overflow-hidden">
                <div className="blur-sm select-none pointer-events-none">
                    <p className="font-medium text-gray-900 text-sm mb-1">{recipe.name}</p>
                    <p className="text-xs text-gray-400">•••</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <LockIcon />
                        <span className="text-xs font-medium">Locked</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-medium text-gray-900 text-sm">{recipe.name}</p>
                <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => router.visit(route('explore.recipe', { id: recipe.id }))}
                >
                    View
                </Button>
            </div>
            {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {recipe.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                    ))}
                </div>
            )}
            <div className="flex items-center justify-between gap-2">
                {recipe.nutrition && (
                    <p className="text-xs text-gray-500">
                        {recipe.nutrition.calories} kcal · {recipe.nutrition.protein}g protein
                    </p>
                )}
                {recipe.made_count != null && recipe.made_count > 0 && (
                    <p className="text-xs text-brand-500 font-medium shrink-0">
                        Made {recipe.made_count} {recipe.made_count === 1 ? 'time' : 'times'}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function Explore() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [unlockTarget, setUnlockTarget] = useState<Category | null>(null);
    const [showThankYou, setShowThankYou] = useState(false);
    const [showCanceled, setShowCanceled] = useState(false);

    useEffect(() => {
        fetch('/api/explore', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(data => {
                if (!data.ok) return;
                const cats: Category[] = data.categories;
                setCategories(cats);
                if (cats.length > 0) setSelectedId(cats[0].id);
            })
            .finally(() => setLoading(false));

        const params = new URLSearchParams(window.location.search);
        if (params.has('stripe_success')) {
            setShowThankYou(true);
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => setShowThankYou(false), 5000);
        }
        if (params.has('stripe_canceled')) {
            setShowCanceled(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const selected = categories.find(c => c.id === selectedId) ?? null;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-5 pb-3">
                <h1 className="text-xl font-bold text-gray-900">Explore</h1>
                <p className="text-sm text-gray-500 mt-0.5">Premium recipe collections</p>
            </div>

            {/* Stripe status banners */}
            {showThankYou && (
                <div className="mx-4 mb-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-center">
                    <p className="text-sm font-semibold text-green-700 mb-1">Thank you!</p>
                    <p className="text-xs text-green-600">Your access has been activated. Enjoy the recipes!</p>
                </div>
            )}

            {showCanceled && (
                <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-center">
                    <p className="text-sm text-amber-700">Payment was canceled. You can try again below.</p>
                </div>
            )}

            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-gray-500">Loading…</p>
                </div>
            )}

            {!loading && categories.length === 0 && (
                <div className="flex-1 flex items-center justify-center px-6">
                    <p className="text-sm text-gray-500 text-center">No categories available yet. Check back soon.</p>
                </div>
            )}

            {!loading && categories.length > 0 && (
                <>
                    {/* Category pills — horizontal scroll */}
                    <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2 w-max">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedId(cat.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                        selectedId === cat.id
                                            ? 'bg-brand-500 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {!cat.has_access && (
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    )}
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected category content */}
                    {selected && (
                        <div className="flex-1 overflow-y-auto px-4 pb-6">
                            {/* Category header */}
                            <div className="mb-4">
                                {selected.description && (
                                    <p className="text-sm text-gray-500 mb-3">{selected.description}</p>
                                )}
                                {!selected.has_access && (
                                    <button
                                        onClick={() => setUnlockTarget(selected)}
                                        className="w-full py-3 rounded-2xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <LockIcon />
                                        Unlock {selected.name} — €{selected.price.toFixed(2)}
                                    </button>
                                )}
                            </div>

                            {/* Recipes grid */}
                            <div className="flex flex-col gap-3">
                                {selected.recipes.map(recipe => (
                                    <RecipeCard
                                        key={recipe.id}
                                        recipe={recipe}
                                        locked={!selected.has_access || !!recipe.locked}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Unlock modal/sheet */}
            {unlockTarget && (
                <UnlockModal category={unlockTarget} onClose={() => setUnlockTarget(null)} />
            )}
        </div>
    );
}

Explore.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
