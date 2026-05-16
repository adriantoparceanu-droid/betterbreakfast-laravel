import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '@/store/settingsStore';

describe('settingsStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useSettingsStore.setState({ locale: 'en' });
    });

    it('defaults to en', () => {
        expect(useSettingsStore.getState().locale).toBe('en');
    });

    it('setLocale switches the active locale', () => {
        useSettingsStore.getState().setLocale('ro');
        expect(useSettingsStore.getState().locale).toBe('ro');
    });

    it('persists the locale under the bb-settings key', () => {
        useSettingsStore.getState().setLocale('ro');
        expect(localStorage.getItem('bb-settings')).toContain('"locale":"ro"');
    });
});
