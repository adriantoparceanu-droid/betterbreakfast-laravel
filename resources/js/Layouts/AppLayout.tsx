import { type ReactNode } from 'react';
import { SyncBootstrap } from '@/Components/providers/SyncBootstrap';
import { AppHeader } from '@/Components/layout/AppHeader';
import { BottomNav } from '@/Components/navigation/BottomNav';
import { useEnsurePlanAssigned } from '@/hooks/useEnsurePlanAssigned';

// Single, persistent home for the canonical plan initializer — runs across
// every app screen (Staples after onboarding, Today, Plan, …), once recipes load.
function PlanInitializer() {
    useEnsurePlanAssigned();
    return null;
}

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <SyncBootstrap>
            <PlanInitializer />
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
