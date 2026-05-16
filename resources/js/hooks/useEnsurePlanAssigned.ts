import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useRecipes, useRecipesLoaded } from '@/hooks/useRecipes';
import { shuffle } from '@/lib/utils';

/**
 * Canonical, single-source plan initializer. Mounted once in AppLayout so it
 * runs no matter which app screen the user lands on after onboarding
 * (post-onboarding redirect → /staples → AppLayout).
 *
 * Rules:
 * - Never runs against the hardcoded fallback set (gated on useRecipesLoaded —
 *   useLiveQuery is `undefined` on first render even when Dexie has data).
 * - Fills only days that are missing or point to a recipe absent from the DB
 *   set, AND are not in the past / not completed (day >= currentDay).
 * - Preserves every recipe already locked into a valid day — no reshuffle.
 * - Never rewrites completed / past days → user history stays intact.
 *
 * Reset/Restart still assigns all 10 explicitly; this hook then early-returns
 * because nothing is missing. Plan is now a pure preview/reorder screen.
 */
export function useEnsurePlanAssigned(): void {
    const { progress, updateProgress, isHydrated } = useUserStore();
    const { currentDay, completedDays, selectedRecipes } = progress;
    const recipes = useRecipes();
    const recipesLoaded = useRecipesLoaded();

    useEffect(() => {
        if (!isHydrated || !recipesLoaded || !recipes.length) return;

        const validIds = new Set(recipes.map(r => r.id));
        const days = Array.from({ length: 10 }, (_, i) => i + 1)
            .filter(d => d >= currentDay && !completedDays.includes(d));

        const needsAssign = days.filter(d => {
            const id = selectedRecipes[d];
            return !id || !validIds.has(id);
        });
        if (needsAssign.length === 0) return;

        const taken = new Set(
            Object.values(selectedRecipes).filter(id => validIds.has(id)),
        );

        const pool = shuffle(recipes.filter(r => !taken.has(r.id)));
        if (pool.length === 0) return;

        const newSelected = { ...selectedRecipes };
        let i = 0;
        for (const d of needsAssign) {
            if (i >= pool.length) break;
            newSelected[d] = pool[i++].id;
        }
        updateProgress({ selectedRecipes: newSelected });
    }, [isHydrated, recipesLoaded, recipes.length, recipes[0]?.id, currentDay, completedDays.length, Object.keys(selectedRecipes).length]); // eslint-disable-line react-hooks/exhaustive-deps
}
