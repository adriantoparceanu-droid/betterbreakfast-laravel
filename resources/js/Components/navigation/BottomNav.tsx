import { router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/useT';

function TodayIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
    );
}

function PlanIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function StaplesIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    );
}

function ExploreIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

const tabs = [
    { routeName: 'today',   labelKey: 'nav.today',   Icon: TodayIcon },
    { routeName: 'plan',    labelKey: 'nav.plan',    Icon: PlanIcon },
    { routeName: 'staples', labelKey: 'nav.staples', Icon: StaplesIcon },
    { routeName: 'explore', labelKey: 'nav.explore', Icon: ExploreIcon },
] as const;

export function BottomNav() {
    const { url } = usePage();
    const { t } = useT();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-nav"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
                {tabs.map(({ routeName, labelKey, Icon }) => {
                    const label = t(labelKey);
                    const href = route(routeName);
                    const isActive = url === href || url.startsWith(href + '/') || url.startsWith('/' + routeName);

                    return (
                        <button
                            key={routeName}
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(5);
                                router.visit(route(routeName));
                            }}
                            className={cn(
                                'relative flex flex-col items-center justify-center gap-0.5',
                                'flex-1 h-full pt-1',
                                'transition-colors duration-150 focus-visible:outline-none',
                            )}
                            aria-label={label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute top-1 w-10 h-0.5 rounded-full bg-brand-600"
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                            )}
                            <Icon className={cn('w-6 h-6 transition-colors duration-150', isActive ? 'text-brand-600' : 'text-gray-500')} />
                            <span className={cn('text-[10px] font-semibold tracking-wide transition-colors duration-150', isActive ? 'text-brand-600' : 'text-gray-500')}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
