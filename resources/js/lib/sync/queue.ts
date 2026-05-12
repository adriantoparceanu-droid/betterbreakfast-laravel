import { db } from '@/lib/db/dexie';
import type { SyncType, SyncQueueItem } from '@/types/app';

export async function enqueueSync(userId: string, type: SyncType, payload: Record<string, unknown>): Promise<void> {
    await db.syncQueue.add({ userId, type, payload, synced: false, retries: 0, createdAt: new Date() });
}

export async function getPendingItems(userId: string): Promise<SyncQueueItem[]> {
    return db.syncQueue.filter((item) => item.userId === userId && !item.synced).toArray();
}

export async function markItemSynced(id: number): Promise<void> {
    await db.syncQueue.update(id, { synced: true });
}

export async function incrementRetry(id: number): Promise<void> {
    const item = await db.syncQueue.get(id);
    if (item) await db.syncQueue.update(id, { retries: item.retries + 1 });
}
