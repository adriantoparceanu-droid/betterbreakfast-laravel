import { router } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { useRecipeById, useRecipes } from '@/hooks/useRecipes';
import { enqueueSync } from '@/lib/sync/queue';
import { track } from '@/lib/analytics';
import { Button } from '@/Components/ui/Button';
import { cn } from '@/lib/utils';
import AppLayout from '@/Layouts/AppLayout';
import type { Recipe } from '@/types/app';

interface Props { day: number; }

export default function SwapPage({ day }: Props) {
    const dayNumber = Number(day);
    const { progress, userId, updateProgress } = useUserStore();
    const { selectedRecipes, completedDays } = progress;

    const currentRecipeId = selectedRecipes[dayNumber];
    const currentRecipe = useRecipeById(currentRecipeId);
    const allRecipes = useRecipes();

    // Available = recipes not locked in a completed day, excluding current day's recipe
    const completedRecipeIds = new Set(
        completedDays.map(d => selectedRecipes[d]).filter(Boolean)
    );
    const alternatives = allRecipes.filter(
        r => !completedRecipeIds.has(r.id) && r.id !== currentRecipeId
    );

    const handleSelect = async (recipeId: string) => {
        const fromRecipeId = currentRecipeId;

        // True swap: find the other day that currently holds this recipe and give it the displaced recipe
        const otherDayKey = Object.keys(selectedRecipes).find(k => selectedRecipes[k] === recipeId);
        const newSelectedRecipes: Record<string, string> = { ...selectedRecipes, [dayNumber]: recipeId };
        if (otherDayKey && fromRecipeId) {
            newSelectedRecipes[otherDayKey] = fromRecipeId;
        }

        updateProgress({ selectedRecipes: newSelectedRecipes });
        if (userId) {
            enqueueSync(userId, 'PROGRESS_UPDATE', { selectedRecipes: newSelectedRecipes });
            await track('SWAP_RECIPE', { dayNumber, fromRecipeId, toRecipeId: recipeId });
        }
        window.history.back();
    };

    return (
        <div className="flex flex-col pb-nav">
            <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                <button onClick={() => window.history.back()}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg">←</button>
                <h1 className="text-xl font-bold text-gray-900">Choose another option</h1>
            </div>
            <div className="px-4 flex flex-col gap-2">
                {currentRecipe && <RecipeCard recipe={currentRecipe} isCurrent />}
                {alternatives.length > 0 && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2 mb-1 px-1">Available options</p>
                )}
                {alternatives.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} onPick={() => handleSelect(recipe.id)} />
                ))}
                {alternatives.length === 0 && (
                    <div className="py-8 text-center">
                        <p className="text-sm text-gray-400">No other recipes available.</p>
                        <p className="text-xs text-gray-300 mt-1">All options have been used this cycle.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface CardProps { recipe: Recipe; isCurrent?: boolean; onPick?: () => void; }

function RecipeCard({ recipe, isCurrent, onPick }: CardProps) {
    const { nutrition } = recipe;
    return (
        <div className={cn('bg-white border rounded-2xl overflow-hidden transition-all duration-150',
            isCurrent ? 'border-brand-300 ring-1 ring-brand-200' : 'border-gray-100 hover:border-brand-200 hover:shadow-sm')}>
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center shrink-0 text-2xl">🥣</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{recipe.name}</p>
                        {isCurrent && <span className="shrink-0 text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">Current</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                        <span className="font-medium text-gray-600">{nutrition.calories} kcal</span>
                        <span>·</span><span>{nutrition.protein}g P</span>
                        <span>·</span><span>{nutrition.carbs}g C</span>
                        <span>·</span><span>{nutrition.fat}g F</span>
                        <span>·</span><span>{nutrition.fiber}g fiber</span>
                    </div>
                </div>
                {!isCurrent && <Button variant="secondary" size="sm" onClick={onPick}>Pick</Button>}
            </div>
        </div>
    );
}

SwapPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
