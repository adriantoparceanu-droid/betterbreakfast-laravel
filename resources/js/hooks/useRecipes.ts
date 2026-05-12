import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { recipes as fallback } from '@/data/recipes';
import type { Recipe } from '@/types/app';

export function useRecipes(): Recipe[] {
    const dbRecipes = useLiveQuery(() => db.recipes.toArray(), []);
    if (!dbRecipes || dbRecipes.length === 0) return fallback;
    return dbRecipes;
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
