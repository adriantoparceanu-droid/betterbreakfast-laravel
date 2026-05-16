import type { Locale } from '@/store/settingsStore';
import type { Recipe } from '@/types/app';

// EN is the source of truth (base columns). RO lives in translations.ro.
// Every field falls back to EN when the RO value is missing.

export function localizeRecipe(recipe: Recipe, locale: Locale): Recipe {
    if (locale === 'en') return recipe;
    const tr = recipe.translations?.ro;
    if (!tr) return recipe;

    return {
        ...recipe,
        name: tr.name || recipe.name,
        steps: tr.steps && tr.steps.length ? tr.steps : recipe.steps,
        substitutions: tr.substitutions || recipe.substitutions,
        whyThisWorks: tr.whyThisWorks || recipe.whyThisWorks,
        tags: tr.tags && tr.tags.length ? tr.tags : recipe.tags,
        ingredients: recipe.ingredients.map((ing, i) => {
            const roName = tr.ingredients?.[i]?.name;
            return roName ? { ...ing, name: roName } : ing;
        }),
    };
}

// EN ingredient name → localized name. Keys stay EN-canonical so callers
// (e.g. Staples pantry checklist) can keep stable, locale-independent keys.
export function buildIngredientNameMap(recipes: Recipe[], locale: Locale): Map<string, string> {
    const map = new Map<string, string>();
    if (locale === 'en') return map;
    for (const recipe of recipes) {
        const roIngs = recipe.translations?.ro?.ingredients;
        if (!roIngs) continue;
        recipe.ingredients.forEach((ing, i) => {
            const roName = roIngs[i]?.name;
            if (roName && !map.has(ing.name)) map.set(ing.name, roName);
        });
    }
    return map;
}

// Generic single-field localization for category/module-style payloads
// where translations is { ro: { name?, description? } }.
type SimpleTranslations = Record<string, Record<string, string | undefined> | undefined> | null | undefined;

export function localized(
    locale: Locale,
    fallback: string,
    translations: SimpleTranslations,
    field: string,
): string {
    if (locale === 'en' || !translations) return fallback;
    return translations[locale]?.[field] || fallback;
}
