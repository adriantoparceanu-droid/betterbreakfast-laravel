import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { useSyncStore } from '@/store/syncStore';
import { getLocalProgress, clearAllLocalData, bootstrapRecipes } from '@/lib/db/dexie';
import { startBackgroundSync } from '@/lib/sync/engine';
import { DEFAULT_USER_PROGRESS } from '@/types/app';
import type { PageProps } from '@/types/index.d';

export function SyncBootstrap({ children }: { children: React.ReactNode }) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user ?? null;
    const userId = user ? String(user.id) : null;

    const { setUserId, setProgress, setHydrated } = useUserStore();
    const { setOnline } = useSyncStore();
    const prevUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (prevUserIdRef.current !== null && prevUserIdRef.current !== userId) {
            setProgress(DEFAULT_USER_PROGRESS);
            setUserId(null);
        }
        prevUserIdRef.current = userId;

        if (!userId) { setHydrated(); return; }

        setUserId(userId);

        (async () => {
            try {
                const res = await fetch('/api/user/progress', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                if (res.ok) {
                    const json = await res.json();
                    if (json.forceReset) {
                        await clearAllLocalData(userId);
                        setProgress({ ...DEFAULT_USER_PROGRESS, onboardingDone: false });
                        setHydrated();
                        return;
                    }
                }
            } catch { /* offline */ }

            const local = await getLocalProgress(userId);
            if (local) setProgress(local.progress);
            setHydrated();
        })();
    }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (navigator.onLine) bootstrapRecipes();
    }, []);

    useEffect(() => {
        if (!userId) return;
        return startBackgroundSync(userId);
    }, [userId]);

    useEffect(() => {
        setOnline(navigator.onLine);
        const on = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
    }, [setOnline]);

    return <>{children}</>;
}
