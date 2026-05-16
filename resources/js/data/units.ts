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

