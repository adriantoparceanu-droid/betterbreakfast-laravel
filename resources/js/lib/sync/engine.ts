import { getPendingItems, markItemSynced, incrementRetry } from './queue';
import { flushAnalytics } from '@/lib/analytics';

const MAX_RETRIES = 3;
let isSyncing = false;

export async function runSync(userId: string): Promise<void> {
    if (isSyncing || typeof window === 'undefined' || !navigator.onLine) return;
    isSyncing = true;

    try {
        const items = await getPendingItems(userId);

        for (const item of items) {
            if (item.retries >= MAX_RETRIES) continue;
            try {
                const res = await fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({ type: item.type, payload: item.payload }),
                });
                if (res.ok) await markItemSynced(item.id!);
                else await incrementRetry(item.id!);
            } catch {
                await incrementRetry(item.id!);
            }
        }

        await flushAnalytics();
    } finally {
        isSyncing = false;
    }
}

export function startBackgroundSync(userId: string): () => void {
    const sync = () => runSync(userId);
    window.addEventListener('online', sync);
    const interval = setInterval(sync, 30_000);
    if (navigator.onLine) sync();
    return () => {
        window.removeEventListener('online', sync);
        clearInterval(interval);
    };
}
