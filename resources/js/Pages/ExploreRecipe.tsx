import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import { cn, formatQty, convertUnit, type UnitSystem } from '@/lib/utils';
import AppLayout from '@/Layouts/AppLayout';

interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
}

interface Nutrition {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
}

interface Recipe {
    id: string;
    name: string;
    image: string;
    base_servings: number;
    ingredients: Ingredient[];
    steps: string[];
    nutrition: Nutrition | null;
    tags: string[] | null;
    substitutions: string | null;
    why_this_works: string | null;
}

interface Props {
    recipe: Recipe;
    category: { id: string; name: string };
    made_count: number;
}

export default function ExploreRecipe({ recipe, category, made_count }: Props) {
    const [servings, setServings] = useState(recipe.base_servings);
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
    const [openSubstitutions, setOpenSubstitutions] = useState(false);
    const [openWhyWorks, setOpenWhyWorks] = useState(false);
    const [madeDone, setMadeDone] = useState(false);
    const [localMadeCount, setLocalMadeCount] = useState(made_count);

    const scale = servings / recipe.base_servings;

    const handleMadeThis = async () => {
        setMadeDone(true);
        setLocalMadeCount(c => c + 1);
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    events: [{
                        anonymousId: `explore-${recipe.id}`,
                        event: 'EXPLORE_MADE_THIS',
                        properties: {
                            recipeId: recipe.id,
                            recipeName: recipe.name,
                            categoryId: category.id,
                            categoryName: category.name,
                        },
                    }],
                }),
            });
        } catch {
            // fail silently — event will be lost but UX stays intact
        }
    };

    return (
        <div className="flex flex-col pb-36">
            <div className="px-4 pt-5 pb-2">
                <p className="text-xs text-brand-500 font-medium uppercase tracking-wide">{category.name}</p>
                <h1 className="text-xl font-bold text-gray-900 mt-0.5">{recipe.name}</h1>
                {localMadeCount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                        Made {localMadeCount} {localMadeCount === 1 ? 'time' : 'times'}
                    </p>
                )}
            </div>

            <div className="px-4 flex flex-col gap-5">
                <div className="aspect-[4/3] bg-gradient-to-br from-brand-50 to-brand-100 rounded-3xl overflow-hidden flex items-center justify-center">
                    {recipe.image
                        ? <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                        : <span className="text-7xl">🥣</span>
                    }
                </div>

                {recipe.nutrition && (
                    <div className="grid grid-cols-5 gap-1 text-center">
                        {[
                            { label: 'Cal',     value: Math.round(recipe.nutrition.calories * scale) },
                            { label: 'Protein', value: `${Math.round(recipe.nutrition.protein * scale)}g` },
                            { label: 'Carbs',   value: `${Math.round(recipe.nutrition.carbs * scale)}g` },
                            { label: 'Fat',     value: `${Math.round(recipe.nutrition.fat * scale)}g` },
                            { label: 'Fiber',   value: `${Math.round(recipe.nutrition.fiber * scale)}g` },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-gray-50 rounded-2xl py-2 px-1">
                                <p className="text-sm font-bold text-gray-900">{value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                    <p className="text-sm font-semibold text-gray-700 shrink-0">Servings</p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setServings(s => Math.max(1, s - 1))}
                            disabled={servings <= 1}
                            className="w-8 h-8 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                        >−</button>
                        <span className="text-lg font-bold text-gray-900 w-5 text-center tabular-nums">{servings}</span>
                        <button
                            onClick={() => setServings(s => Math.min(8, s + 1))}
                            disabled={servings >= 8}
                            className="w-8 h-8 rounded-xl bg-white shadow-sm text-gray-700 font-bold text-lg flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                        >+</button>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center bg-white rounded-lg shadow-sm p-0.5">
                        {(['metric', 'imperial'] as UnitSystem[]).map(sys => (
                            <button
                                key={sys}
                                onClick={() => setUnitSystem(sys)}
                                className={cn(
                                    'px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150',
                                    unitSystem === sys ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-600',
                                )}
                            >
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
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setOpenSubstitutions(s => !s)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left"
                        >
                            <h3 className="text-sm font-bold text-gray-900">Substitutions</h3>
                            <span className={cn('text-gray-400 text-xs transition-transform duration-200', openSubstitutions ? 'rotate-180' : '')}>▼</span>
                        </button>
                        {openSubstitutions && (
                            <div className="px-5 pb-4">
                                <div
                                    className="text-sm text-gray-700 leading-relaxed rte-display"
                                    dangerouslySetInnerHTML={{ __html: recipe.substitutions }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {recipe.why_this_works && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setOpenWhyWorks(s => !s)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left"
                        >
                            <h3 className="text-sm font-bold text-gray-900">Why this works</h3>
                            <span className={cn('text-gray-400 text-xs transition-transform duration-200', openWhyWorks ? 'rotate-180' : '')}>▼</span>
                        </button>
                        {openWhyWorks && (
                            <div className="px-5 pb-4">
                                <div
                                    className="text-sm text-gray-700 leading-relaxed rte-display"
                                    dangerouslySetInnerHTML={{ __html: recipe.why_this_works }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-2 pt-2">
                <div className="flex gap-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 px-4 py-3">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => router.visit(route('explore'))}
                    >
                        ← Back
                    </Button>
                    <Button
                        size="lg"
                        fullWidth
                        disabled={madeDone}
                        onClick={handleMadeThis}
                    >
                        {madeDone ? 'Done ✓' : 'I Made This'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

ExploreRecipe.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
