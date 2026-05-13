export type UnitSystem = 'metric' | 'imperial';

export const METRIC_UNITS    = ['g', 'kg', 'ml', 'cl', 'dl', 'l'] as const;
export const IMPERIAL_UNITS  = ['oz', 'lb', 'fl oz', 'tsp', 'tbsp', 'cup'] as const;
export const UNIVERSAL_UNITS = [
    'whole', 'piece', 'slice', 'clove', 'can', 'packet', 'bunch',
    'handful', 'sprig', 'stalk', 'head', 'knob', 'pinch', 'dash',
    'drop', 'splash', 'drizzle', 'dollop',
] as const;

export const ALL_UNITS = [...METRIC_UNITS, ...IMPERIAL_UNITS, ...UNIVERSAL_UNITS] as const;
export type Unit = typeof ALL_UNITS[number];

export function unitSystem(unit: string): UnitSystem | 'universal' {
    if ((METRIC_UNITS as readonly string[]).includes(unit))   return 'metric';
    if ((IMPERIAL_UNITS as readonly string[]).includes(unit)) return 'imperial';
    return 'universal';
}

// ─── Form toggle conversion (between metric ↔ imperial) ──────────────────────

interface ConvResult { qty: number; unit: string; }

// metric → imperial
const M_TO_I: Record<string, { factor: number; unit: string }> = {
    g:  { factor: 1 / 28.3495, unit: 'oz'    },
    kg: { factor: 2.20462,     unit: 'lb'    },
    ml: { factor: 1 / 29.5735, unit: 'fl oz' },
    cl: { factor: 1 / 2.95735, unit: 'fl oz' },
    dl: { factor: 1 / 0.295735,unit: 'fl oz' },
    l:  { factor: 33.814,      unit: 'fl oz' },
};

// imperial → metric
const I_TO_M: Record<string, { factor: number; unit: string }> = {
    oz:     { factor: 28.3495,  unit: 'g'  },
    lb:     { factor: 453.592,  unit: 'g'  },
    'fl oz':{ factor: 29.5735,  unit: 'ml' },
    tsp:    { factor: 4.92892,  unit: 'ml' },
    tbsp:   { factor: 14.7868,  unit: 'ml' },
    cup:    { factor: 236.588,  unit: 'ml' },
};

export function convertForForm(qty: number, unit: string, to: UnitSystem): ConvResult {
    const map = to === 'imperial' ? M_TO_I : I_TO_M;
    const entry = map[unit];
    if (!entry) return { qty, unit }; // universal or already in target system
    const converted = qty * entry.factor;
    const rounded = Math.round(converted * 10) / 10;
    return { qty: rounded, unit: entry.unit };
}

// ─── Nutrition calculation: any unit → grams ─────────────────────────────────

const TO_GRAMS: Record<string, number> = {
    // Metric
    g:      1,
    kg:     1000,
    ml:     1,        // ≈1 g/ml (water density)
    cl:     10,
    dl:     100,
    l:      1000,
    // Imperial
    oz:     28.3495,
    lb:     453.592,
    'fl oz':29.5735,
    tsp:    4.92892,
    tbsp:   14.7868,
    cup:    236.588,
    // Universal — approximate conversions (used for estimation only)
    piece:   50,
    slice:   25,
    clove:   5,
    can:     120,     // drained weight (e.g. sardine/tuna can)
    packet:  30,
    bunch:   80,
    handful: 30,
    sprig:   5,
    stalk:   50,
    head:    500,
    knob:    10,
    pinch:   0.5,
    dash:    0.6,
    drop:    0.05,
    splash:  15,
    drizzle: 5,
    dollop:  15,
};

// Gram weight per single "whole" item — ingredient-specific
export const WHOLE_GRAMS: Record<string, number> = {
    'eggs':         55,
    'egg':          55,
    'egg whites':   33,
    'kiwi':         75,
    'banana':       120,
    'frozen banana':120,
    'avocado':      200,
    'ripe avocado': 200,
    'bell pepper':  150,
    'bell peppers': 150,
    'olives':       5,
    'olive':        5,
    'lemon':        80,
    'lime':         70,
    'orange':       180,
    'tomato':       100,
    'cherry tomato':15,
};

export function toGrams(qty: number, unit: string): number | null {
    const factor = TO_GRAMS[unit];
    if (factor === undefined) return null; // 'whole' or unknown — caller handles
    return qty * factor;
}
