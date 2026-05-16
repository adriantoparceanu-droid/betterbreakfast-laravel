import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Unbiased Fisher-Yates shuffle (Array.sort(() => Math.random() - 0.5) is biased).
export function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function scaleIngredient(quantity: number, servings: number, baseServings: number): number {
    const scaled = (quantity / baseServings) * servings;
    return Math.round(scaled * 10) / 10;
}

export function formatQty(n: number): string {
    const r = Math.round(n * 100) / 100;
    return r % 1 === 0 ? String(r) : r.toFixed(2).replace(/\.?0+$/, '');
}

export type UnitSystem = 'metric' | 'imperial';

const METRIC_CONVERSIONS: Record<string, { factor: number; unit: string }> = {
    cup:  { factor: 240, unit: 'ml' },
    cups: { factor: 240, unit: 'ml' },
    tbsp: { factor: 15,  unit: 'ml' },
    tsp:  { factor: 5,   unit: 'ml' },
};

const IMPERIAL_CONVERSIONS: Record<string, { factor: number; unit: string }> = {
    g:  { factor: 1 / 28.3495, unit: 'oz' },
    ml: { factor: 1 / 29.5735, unit: 'fl oz' },
};

export function convertUnit(quantity: number, unit: string, system: UnitSystem): { qty: number; unit: string } {
    if (system === 'metric') {
        const conv = METRIC_CONVERSIONS[unit];
        if (conv) return { qty: Math.round(quantity * conv.factor), unit: conv.unit };
    } else {
        const conv = IMPERIAL_CONVERSIONS[unit];
        if (conv) return { qty: Math.round(quantity * conv.factor * 10) / 10, unit: conv.unit };
    }
    return { qty: quantity, unit };
}
