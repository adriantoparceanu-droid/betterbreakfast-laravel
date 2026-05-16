import en, { type Dictionary } from './en';
import ro from './ro';
import type { Locale } from '@/store/settingsStore';

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, ro };

export function getDictionary(locale: Locale): Dictionary {
    return dictionaries[locale] ?? en;
}

export { en, ro };
