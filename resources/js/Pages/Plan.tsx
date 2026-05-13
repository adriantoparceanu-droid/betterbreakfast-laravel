import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { useRecipes } from '@/hooks/useRecipes';
import { cn } from '@/lib/utils';
import AppLayout from '@/Layouts/AppLayout';

export default function PlanPage() {
    const { progress, updateProgress } = useUserStore();
    const { currentDay, completedDays, selectedRecipes, checkIns } = progress;
    const recipes = useRecipes();
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    useEffect(() => {
        if (!recipes.length) return;
        const unassigned = Array.from({ length: 10 }, (_, i) => i + 1).filter(day => !selectedRecipes[day]);
        if (!unassigned.length) return;
        const assignedIds = new Set(Object.values(selectedRecipes));
        const available = recipes.filter(r => !assignedIds.has(r.id));
        if (!available.length) return;
        const newSelected = { ...selectedRecipes };
        const newUsed = new Set(progress.usedRecipeIds);
        let idx = 0;
        for (const day of unassigned) {
            if (idx >= available.length) break;
            newSelected[day] = available[idx].id;
            newUsed.add(available[idx].id);
            idx++;
        }
        updateProgress({ selectedRecipes: newSelected, usedRecipeIds: Array.from(newUsed) });
    }, [recipes.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const moodLabel: Record<string, string> = { energized: '⚡ Energized', full: '😊 Full', hungry: '😐 Still hungry' };

    return (
        <div className="flex flex-col pb-nav">
            <div className="px-4 pt-4 pb-3">
                <h1 className="text-2xl font-bold text-gray-900">10-Day Plan</h1>
                <p className="text-sm text-gray-400 mt-0.5">{completedDays.length} of 10 days complete</p>
                <div className="flex gap-1 mt-3">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((day) => (
                        <div key={day} className={cn('flex-1 h-1.5 rounded-full transition-colors duration-300',
                            completedDays.includes(day) ? 'bg-brand-500' : day === currentDay ? 'bg-brand-200' : 'bg-gray-100')} />
                    ))}
                </div>
            </div>

            <div className="px-4 flex flex-col gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((day) => {
                    const isDone   = completedDays.includes(day);
                    const isToday  = day === currentDay;
                    const isFuture = day > currentDay;
                    const isPast   = day < currentDay && !isDone;
                    const recipeId = selectedRecipes[day];
                    const recipe   = recipeId ? recipeMap.get(recipeId) : undefined;
                    const mood     = checkIns[day];

                    const isClickable = isToday || isFuture;

                    return (
                        <div
                            key={day}
                            onClick={() => {
                                if (!isClickable) return;
                                if (isToday) router.visit(route('today'));
                                else router.visit(route('swap', { day }));
                            }}
                            className={cn('bg-white border rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-150',
                                isDone   && 'border-gray-100',
                                isToday  && 'border-brand-300 ring-1 ring-brand-200 shadow-sm',
                                isFuture && 'border-gray-100 hover:border-brand-200 hover:shadow-sm cursor-pointer',
                                isPast   && 'border-gray-100 opacity-50',
                            )}
                        >
                            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0',
                                isDone ? 'bg-brand-500 text-white' : isToday ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-400')}>
                                {isDone ? '✓' : day}
                            </div>
                            <div className="flex-1 min-w-0">
                                {recipe ? (
                                    <>
                                        <p className={cn('font-semibold text-sm truncate', isDone || isPast ? 'text-gray-500' : 'text-gray-900')}>{recipe.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{isDone && mood ? moodLabel[mood] : `${recipe.nutrition.calories} kcal`}</p>
                                    </>
                                ) : (
                                    <p className={cn('text-sm', isFuture ? 'text-gray-400' : 'text-gray-300')}>
                                        {isToday ? 'Go to today' : isFuture ? 'Not set' : '—'}
                                    </p>
                                )}
                            </div>
                            {isToday && <span className="shrink-0 text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Today</span>}
                            {isFuture && <span className="text-gray-300 text-base shrink-0">{recipe ? '→' : '+'}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

PlanPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
