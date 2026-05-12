import { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';

interface Recipe {
    id: string;
    name: string;
    image?: string;
    base_servings?: number;
    nutrition?: { calories: number; protein: number; fat: number; carbs: number; fiber: number };
    tags?: string[];
    locked?: boolean;
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
                    This collection includes <strong>{category.recipe_count} recipes</strong> available after purchase.
                    To unlock, contact us and we'll activate your access.
                </p>
                <a
                    href={`mailto:hello@betterbreakfast.eu?subject=Unlock: ${encodeURIComponent(category.name)}&body=Hi, I'd like to purchase access to the ${encodeURIComponent(category.name)} category (€${category.price.toFixed(2)}).`}
                    className="block w-full text-center py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors mb-3"
                >
                    Contact to unlock — €{category.price.toFixed(2)}
                </a>
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
            <p className="font-medium text-gray-900 text-sm mb-2">{recipe.name}</p>
            {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {recipe.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                    ))}
                </div>
            )}
            {recipe.nutrition && (
                <p className="text-xs text-gray-400">
                    {recipe.nutrition.calories} kcal · {recipe.nutrition.protein}g protein
                </p>
            )}
        </div>
    );
}

export default function Explore() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [unlockTarget, setUnlockTarget] = useState<Category | null>(null);

    useEffect(() => {
        fetch('/api/explore', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    setCategories(data.categories);
                    if (data.categories.length > 0) setSelectedId(data.categories[0].id);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const selected = categories.find(c => c.id === selectedId) ?? null;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-5 pb-3">
                <h1 className="text-xl font-bold text-gray-900">Explore</h1>
                <p className="text-sm text-gray-400 mt-0.5">Premium recipe collections</p>
            </div>

            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-gray-400">Loading…</p>
                </div>
            )}

            {!loading && categories.length === 0 && (
                <div className="flex-1 flex items-center justify-center px-6">
                    <p className="text-sm text-gray-400 text-center">No categories available yet. Check back soon.</p>
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
                                    {!cat.has_access && (
                                        <span className={`text-[10px] font-semibold ${selectedId === cat.id ? 'text-white/80' : 'text-brand-500'}`}>
                                            €{cat.price.toFixed(2)}
                                        </span>
                                    )}
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
