import { type ReactNode } from 'react';
import { SyncBootstrap } from '@/Components/providers/SyncBootstrap';
import { AppHeader } from '@/Components/layout/AppHeader';
import { BottomNav } from '@/Components/navigation/BottomNav';

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <SyncBootstrap>
            <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-surface-raised">
                <header className="sticky top-0 z-40 bg-white border-b border-gray-100"
                    style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                    <AppHeader />
                </header>
                <main className="flex-1 overflow-y-auto pb-20 animate-fade-in">
                    {children}
                </main>
                <BottomNav />
            </div>
        </SyncBootstrap>
    );
}
