import { describe, it, expect } from 'vitest';
import { localizeRecipe, buildIngredientNameMap, localized } from '@/lib/localize';
import type { Recipe } from '@/types/app';

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
    return {
        id: 'r1',
        name: 'Greek Yogurt Bowl',
        image: '',
        baseServings: 1,
        ingredients: [
            { name: 'Yogurt', quantity: 200, unit: 'g', category: 'Dairy' },
            { name: 'Honey', quantity: 1, unit: 'tbsp', category: 'Condiments' },
        ],
        steps: ['Add yogurt.', 'Drizzle honey.'],
        nutrition: { calories: 300, protein: 20, fat: 8, carbs: 30, fiber: 2 },
        tags: ['quick'],
        substitutions: 'Use plant yogurt.',
        whyThisWorks: 'High protein.',
        ...overrides,
    };
}

describe('localizeRecipe', () => {
    it('returns the recipe untouched for the en locale', () => {
        const r = makeRecipe({ translations: { ro: { name: 'X' } } });
        expect(localizeRecipe(r, 'en')).toBe(r);
    });

    it('returns the recipe untouched when no ro translation exists', () => {
        const r = makeRecipe();
        expect(localizeRecipe(r, 'ro')).toBe(r);
    });

    it('overlays ro fields and falls back to en per field', () => {
        const r = makeRecipe({
            translations: {
                ro: {
                    name: 'Bol cu Iaurt Grecesc',
                    steps: ['Adaugă iaurt.', 'Toarnă miere.'],
                    ingredients: [{ name: 'Iaurt' }], // only first translated
                    // substitutions / whyThisWorks intentionally absent
                },
            },
        });
        const out = localizeRecipe(r, 'ro');

        expect(out.name).toBe('Bol cu Iaurt Grecesc');
        expect(out.steps).toEqual(['Adaugă iaurt.', 'Toarnă miere.']);
        expect(out.ingredients[0].name).toBe('Iaurt');         // translated
        expect(out.ingredients[1].name).toBe('Honey');         // EN fallback
        expect(out.ingredients[0].quantity).toBe(200);         // non-name fields preserved
        expect(out.substitutions).toBe('Use plant yogurt.');   // EN fallback
        expect(out.whyThisWorks).toBe('High protein.');        // EN fallback
    });

    it('keeps en steps when ro steps array is empty', () => {
        const r = makeRecipe({ translations: { ro: { steps: [] } } });
        expect(localizeRecipe(r, 'ro').steps).toEqual(['Add yogurt.', 'Drizzle honey.']);
    });
});

describe('buildIngredientNameMap', () => {
    it('is empty for the en locale', () => {
        const map = buildIngredientNameMap([makeRecipe({ translations: { ro: { ingredients: [{ name: 'Iaurt' }] } } })], 'en');
        expect(map.size).toBe(0);
    });

    it('maps EN ingredient names to RO using positional translations', () => {
        const r = makeRecipe({
            translations: { ro: { ingredients: [{ name: 'Iaurt' }, { name: 'Miere' }] } },
        });
        const map = buildIngredientNameMap([r], 'ro');
        expect(map.get('Yogurt')).toBe('Iaurt');
        expect(map.get('Honey')).toBe('Miere');
    });

    it('keeps EN-stable keys and first-wins across recipes', () => {
        const a = makeRecipe({ id: 'a', translations: { ro: { ingredients: [{ name: 'Iaurt A' }] } } });
        const b = makeRecipe({ id: 'b', translations: { ro: { ingredients: [{ name: 'Iaurt B' }] } } });
        const map = buildIngredientNameMap([a, b], 'ro');
        expect(map.get('Yogurt')).toBe('Iaurt A'); // first occurrence wins, key stays EN
    });
});

describe('localized', () => {
    const tr = { ro: { name: 'Nume RO', description: 'Desc RO' } };

    it('returns fallback for the en locale', () => {
        expect(localized('en', 'Name EN', tr, 'name')).toBe('Name EN');
    });

    it('returns the ro value when present', () => {
        expect(localized('ro', 'Name EN', tr, 'name')).toBe('Nume RO');
    });

    it('falls back when translations are null or field missing', () => {
        expect(localized('ro', 'Name EN', null, 'name')).toBe('Name EN');
        expect(localized('ro', 'Name EN', { ro: {} }, 'name')).toBe('Name EN');
    });
});
