import Dexie, { type Table } from 'dexie';
import type { UserProgressLocal, SyncQueueItem, AnalyticsEvent, Recipe } from '@/types/app';

class BetterBreakfastDB extends Dexie {
    userProgress!: Table<UserProgressLocal, string>;
    syncQueue!: Table<SyncQueueItem, number>;
    analytics!: Table<AnalyticsEvent, number>;
    recipes!: Table<Recipe, string>;

    constructor() {
        super('BetterBreakfastDB');
        this.version(2).stores({
            userProgress: 'id, updatedAt',
            syncQueue: '++id, userId, type, synced, createdAt',
            analytics: '++id, anonymousId, event, synced, createdAt',
            recipes: 'id',
        });
    }
}

export const db = new BetterBreakfastDB();

export async function getLocalProgress(userId: string): Promise<UserProgressLocal | undefined> {
    return db.userProgress.get(userId);
}

export async function saveLocalProgress(data: UserProgressLocal): Promise<void> {
    await db.userProgress.put(data);
}

export async function clearAllLocalData(userId: string): Promise<void> {
    await Promise.all([
        db.userProgress.delete(userId),
        db.syncQueue.where('userId').equals(userId).delete(),
        db.analytics.clear(),
        db.recipes.clear(),
    ]);
    if (typeof window !== 'undefined') {
        localStorage.removeItem('bb-user-progress');
    }
}

export async function bootstrapRecipes(): Promise<void> {
    try {
        const res = await fetch('/api/recipes');
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && Array.isArray(data.recipes)) {
            await db.recipes.bulkPut(data.recipes);
        }
    } catch {
        // offline — use cached fallback
    }
}
