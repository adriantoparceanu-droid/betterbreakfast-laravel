import { useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { getDictionary, en, type Dictionary } from '@/locales';

type Params = Record<string, string | number>;

function resolve(dict: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
        if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
            return (acc as Record<string, unknown>)[key];
        }
        return undefined;
    }, dict);
}

function interpolate(str: string, params?: Params): string {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k: string) =>
        k in params ? String(params[k]) : `{${k}}`,
    );
}

export function useT() {
    const locale = useSettingsStore((s) => s.locale);
    const dict = getDictionary(locale);

    // t resolves a dot-path; falls back to English, then to the raw key.
    const t = useCallback(
        (path: string, params?: Params): string => {
            let val = resolve(dict, path);
            if (typeof val !== 'string') val = resolve(en, path);
            if (typeof val !== 'string') return path;
            return interpolate(val, params);
        },
        [dict],
    );

    return { t, dict, locale } as { t: typeof t; dict: Dictionary; locale: typeof locale };
}
