import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { recipes as fallback } from '@/data/recipes';
import type { Recipe } from '@/types/app';

export function useRecipes(): Recipe[] {
    const dbRecipes = useLiveQuery(() => db.recipes.toArray(), []);
    if (!dbRecipes || dbRecipes.length === 0) return fallback;
    return dbRecipes;
}

// True only once Dexie has resolved with real recipes. `useLiveQuery`
// returns `undefined` on the first synchronous render even when Dexie
// holds data, so this distinguishes the real DB set from the hardcoded
// fallback — callers that mutate persisted state must gate on it.
export function useRecipesLoaded(): boolean {
    const dbRecipes = useLiveQuery(() => db.recipes.toArray(), []);
    return Array.isArray(dbRecipes) && dbRecipes.length > 0;
}

export function useRecipeById(id: string | undefined): Recipe | undefined {
    const recipes = useRecipes();
    if (!id) return undefined;
    return recipes.find((r) => r.id === id);
}

export function useAvailableRecipes(usedIds: string[]): Recipe[] {
    const recipes = useRecipes();
    const usedSet = new Set(usedIds);
    const available = recipes.filter((r) => !usedSet.has(r.id));
    return available.length > 0 ? available : recipes;
}

export function useFirstAvailable(usedIds: string[]): Recipe | undefined {
    return useAvailableRecipes(usedIds)[0];
}
