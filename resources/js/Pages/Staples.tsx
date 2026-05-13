import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { useRecipes } from '@/hooks/useRecipes';
import { scaleIngredient, formatQty, convertUnit, cn, type UnitSystem } from '@/lib/utils';
import AppLayout from '@/Layouts/AppLayout';
import type { IngredientCategory, Recipe } from '@/types/app';

const CATEGORY_ORDER: IngredientCategory[] = ['Proteins', 'Grains & Legumes', 'Dairy', 'Fruits', 'Vegetables', 'Fats, Nuts & Seeds', 'Condiments'];

interface GatheredIngredient { name: string; unit: string; totalQuantity: number; category: IngredientCategory; }

function gatherIngredients(recipes: Recipe[], servings: number): GatheredIngredient[] {
    const map = new Map<string, GatheredIngredient>();
    for (const recipe of recipes) {
        for (const ing of recipe.ingredients) {
            const key = `${ing.name}|${ing.unit}`;
            const scaled = scaleIngredient(ing.quantity, servings, recipe.baseServings);
            const existing = map.get(key);
            if (existing) existing.totalQuantity += scaled;
            else map.set(key, { name: ing.name, unit: ing.unit, totalQuantity: scaled, category: ing.category });
        }
    }
    return Array.from(map.values());
}

export default function StaplesPage() {
    const { progress, togglePantryItem } = useUserStore();
    const { pantryChecked, defaultServings } = progress;
    const [servings, setServings] = useState(defaultServings);
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

    const recipes = useRecipes();
    const ingredients = gatherIngredients(recipes, servings);
    const checkKey = (ing: GatheredIngredient) => `${ing.name}|${ing.unit}`;
    const checkedCount = ingredients.filter((i) => pantryChecked.includes(checkKey(i))).length;

    const grouped = CATEGORY_ORDER.map((cat) => ({
        category: cat,
        items: ingredients.filter((i) => i.category === cat).sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((g) => g.items.length > 0);

    if (ingredients.length === 0) {
        return (
            <div className="flex flex-col pb-nav">
                <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Staples</h1>
                        <button onClick={() => router.visit(route('plan'))} className="text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-xl transition-all duration-150">Start your plan</button>
                    </div>
                </div>
                <div className="px-4">
                    <div className="bg-white border border-gray-100 rounded-2xl py-10 flex flex-col items-center gap-2">
                        <span className="text-4xl">🛒</span>
                        <p className="text-sm text-gray-400 text-center px-6">Loading recipes…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-nav">
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Staples</h1>
                    <button onClick={() => router.visit(route('plan'))} className="text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-xl transition-all duration-150">View plan</button>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">Full 10-day plan · {checkedCount}/{ingredients.length} items checked</p>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${ingredients.length > 0 ? (checkedCount / ingredients.length) * 100 : 0}%` }} />
                </div>
            </div>

            <div className="px-4 mb-3">
                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 shrink-0">Servings</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setServings((s) => Math.max(1, s - 1))} disabled={servings <= 1}
                            className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-colors',
                                servings <= 1 ? 'text-gray-200 bg-gray-50' : 'text-brand-600 bg-brand-50 hover:bg-brand-100')}>−</button>
                        <span className="w-5 text-center font-semibold text-gray-900 tabular-nums text-sm">{servings}</span>
                        <button onClick={() => setServings((s) => Math.min(8, s + 1))} disabled={servings >= 8}
                            className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-colors',
                                servings >= 8 ? 'text-gray-200 bg-gray-50' : 'text-brand-600 bg-brand-50 hover:bg-brand-100')}>+</button>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        {(['metric', 'imperial'] as UnitSystem[]).map((sys) => (
                            <button key={sys} onClick={() => setUnitSystem(sys)}
                                className={cn('px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150',
                                    unitSystem === sys ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600')}>
                                {sys === 'metric' ? 'Metric' : 'Imperial'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-4 flex flex-col gap-4">
                {grouped.map(({ category, items }) => (
                    <div key={category}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">{category}</p>
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                            {items.map((ing) => {
                                const key = checkKey(ing);
                                const isChecked = pantryChecked.includes(key);
                                const { qty, unit } = convertUnit(ing.totalQuantity, ing.unit, unitSystem);
                                return (
                                    <button key={key} onClick={() => togglePantryItem(key)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100">
                                        <span className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                            isChecked ? 'bg-brand-500 border-brand-500' : 'border-gray-300')}>
                                            {isChecked && (
                                                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                                                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                                                </svg>
                                            )}
                                        </span>
                                        <span className={cn('flex-1 text-sm font-medium', isChecked ? 'text-gray-400 line-through' : 'text-gray-900')}>{ing.name}</span>
                                        <span className={cn('text-sm tabular-nums', isChecked ? 'text-gray-300' : 'text-gray-500')}>{formatQty(qty)} {unit}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

StaplesPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
