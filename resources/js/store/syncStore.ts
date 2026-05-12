import { create } from 'zustand';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface SyncState {
    isOnline: boolean;
    status: SyncStatus;
    setOnline: (online: boolean) => void;
    setStatus: (status: SyncStatus) => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
    isOnline: true,
    status: 'idle',
    setOnline: (isOnline) => set({ isOnline }),
    setStatus: (status) => set({ status }),
}));
