import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ziggy's global route() helper — stubbed for component tests.
(globalThis as unknown as { route: (name?: string) => string }).route = (name = '') => `/${name}`;

afterEach(() => {
    cleanup();
    localStorage.clear();
});
