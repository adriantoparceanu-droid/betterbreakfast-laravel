import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'en' | 'ro';

interface SettingsState {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

// Per-device only. Intentionally NOT part of the synced userStore.progress.
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            locale: 'en',
            setLocale: (locale) => set({ locale }),
        }),
        {
            name: 'bb-settings',
            version: 1,
        },
    ),
);
