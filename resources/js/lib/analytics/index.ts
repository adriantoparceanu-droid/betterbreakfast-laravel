import { db } from '@/lib/db/dexie';
import type { AnalyticsEventName, AnalyticsEventProperties } from '@/types/app';

const ANON_ID_KEY = 'bb_anon_id';

function getAnonymousId(): string {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
        id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
}

export async function track(event: AnalyticsEventName, properties: AnalyticsEventProperties = {}): Promise<void> {
    if (typeof window === 'undefined') return;
    await db.analytics.add({ anonymousId: getAnonymousId(), event, properties, synced: false, createdAt: new Date() });
    if (navigator.onLine) flushAnalytics().catch(() => {});
}

export async function flushAnalytics(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const pending = await db.analytics.filter((item) => !item.synced).toArray();
    if (!pending.length) return;
    try {
        const res = await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ events: pending }),
        });
        if (res.ok) {
            await Promise.all(pending.map((item) => db.analytics.update(item.id!, { synced: true })));
        }
    } catch {
        // silent fail
    }
}
