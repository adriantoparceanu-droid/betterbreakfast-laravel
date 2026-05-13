import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { useRecipeById, useFirstAvailable } from '@/hooks/useRecipes';
import { enqueueSync } from '@/lib/sync/queue';
import { Button } from '@/Components/ui/Button';
import { cn, formatQty, convertUnit, type UnitSystem } from '@/lib/utils';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types/index.d';

function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function TodayPage() {
    const { auth } = usePage<PageProps>().props;
    const { progress, userId, isHydrated, selectRecipe } = useUserStore();
    const { currentDay, selectedRecipes, completedDays, usedRecipeIds, defaultServings } = progress;

    const selectedId = selectedRecipes[currentDay];
    const recipe = useRecipeById(selectedId);
    const firstAvailable = useFirstAvailable(usedRecipeIds);

    const [servings, setServings] = useState(defaultServings);
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
    const isCompleted = completedDays.includes(currentDay);
    const allDone = completedDays.length >= 10;

    useEffect(() => { setServings(defaultServings); }, [defaultServings]);

    useEffect(() => {
        if (!isHydrated || !firstAvailable) return;
        // Auto-select when no recipe chosen, OR when the chosen recipe no longer exists in the recipe list
        if (selectedId && recipe) return;
        selectRecipe(currentDay, firstAvailable.id);
        if (userId) {
            enqueueSync(userId, 'PROGRESS_UPDATE', {
                selectedRecipes: { ...selectedRecipes, [currentDay]: firstAvailable.id },
            });
        }
    }, [isHydrated, selectedId, recipe?.id, firstAvailable?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isHydrated) return null;

    const username = auth?.user?.username ?? 'there';
    const scale = recipe ? servings / recipe.baseServings : 1;

    if (allDone) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">You did it!</h1>
                <p className="text-gray-500 text-sm">10 days, 10 breakfasts. Habit unlocked.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-36">
            <div className="px-4 pt-3 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Day {currentDay} of 10</p>
                    {isCompleted && <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Done ✓</span>}
                </div>
                <div className="flex gap-1 mb-3">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((day) => (
                        <div key={day} className={cn('flex-1 h-1.5 rounded-full transition-colors duration-300',
                            completedDays.includes(day) ? 'bg-brand-500' : day === currentDay ? 'bg-brand-200' : 'bg-gray-100')} />
                    ))}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {username}</h1>
            </div>

            {recipe ? (
                <div className="px-4 flex flex-col gap-5">
                    <div className="aspect-[4/3] bg-gradient-to-br from-brand-50 to-brand-100 rounded-3xl flex items-center justify-center">
                        <span className="text-7xl">🥣</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{recipe.name}</h2>
                        {recipe.nutrition && (
                            <div className="grid grid-cols-5 gap-1 text-center">
                                {[
                                    { label: 'Cal',    value: Math.round(recipe.nutrition.calories * scale) },
                                    { label: 'Protein',value: `${Math.round(recipe.nutrition.protein * scale)}g` },
                                    { label: 'Carbs',  value: `${Math.round(recipe.nutrition.carbs * scale)}g` },
                                    { label: 'Fat',    value: `${Math.round(recipe.nutrition.fat * scale)}g` },
                                    { label: 'Fiber',  value: `${Math.round(recipe.nutrition.fiber * scale)}g` },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-gray-50 rounded-2xl py-2 px-1">
                                        <p className="text-sm font-bold text-gray-900">{value}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                        <p className="text-sm font-semibold text-gray-700 shrink-0">Servings</p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setServings((s) => Math.max(1, s - 1))} disabled={servings <= 1}
                                className="w-8 h-8 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform">−</button>
                            <span className="text-lg font-bold text-gray-900 w-5 text-center tabular-nums">{servings}</span>
                            <button onClick={() => setServings((s) => Math.min(8, s + 1))} disabled={servings >= 8}
                                className="w-8 h-8 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform">+</button>
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center bg-white rounded-lg shadow-sm p-0.5">
                            {(['metric', 'imperial'] as UnitSystem[]).map((sys) => (
                                <button key={sys} onClick={() => setUnitSystem(sys)}
                                    className={cn('px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150',
                                        unitSystem === sys ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600')}>
                                    {sys === 'metric' ? 'Metric' : 'Imperial'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Ingredients</h3>
                        <div className="flex flex-col gap-0 divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            {recipe.ingredients.map((ing, i) => {
                                const { qty, unit } = convertUnit(ing.quantity * scale, ing.unit, unitSystem);
                                return (
                                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                                        <span className="text-sm text-gray-800">{ing.name}</span>
                                        <span className="text-sm font-semibold text-gray-600 ml-4 shrink-0">{formatQty(qty)} {unit}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Steps</h3>
                        <div className="flex flex-col gap-3">
                            {recipe.steps.map((step, i) => (
                                <div key={i} className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {recipe.substitutions && (
                        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Substitutions</h3>
                            <div
                                className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: recipe.substitutions }}
                            />
                        </div>
                    )}

                    {recipe.whyThisWorks && (
                        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Why this works</h3>
                            <div
                                className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: recipe.whyThisWorks }}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="px-4 flex items-center justify-center py-20">
                    <p className="text-sm text-gray-400">Loading recipe…</p>
                </div>
            )}

            {recipe && !isCompleted && (
                <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-2 pt-2">
                    <div className="flex gap-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 px-4 py-3">
                        <Button variant="secondary" size="lg" onClick={() => router.visit(route('swap', { day: currentDay }))}>Swap</Button>
                        <Button size="lg" fullWidth onClick={() => router.visit(route('complete', { day: currentDay }))}>I made this</Button>
                    </div>
                </div>
            )}

            {recipe && isCompleted && (
                <div className="px-4 mt-4">
                    <div className="bg-brand-50 rounded-2xl p-4 text-center">
                        <p className="text-sm font-semibold text-brand-700">Day {currentDay} complete ✓</p>
                        <p className="text-xs text-brand-500 mt-0.5">
                            {progress.checkIns[currentDay] ? `You felt ${progress.checkIns[currentDay]}` : `Check in tomorrow for day ${currentDay + 1}`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

TodayPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
