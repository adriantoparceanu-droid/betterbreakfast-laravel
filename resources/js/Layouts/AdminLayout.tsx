import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types/index.d';

interface AdminNavCategory {
    id: string;
    name: string;
    isActive: boolean;
}

type AdminPageProps = PageProps<{ adminNavCategories?: AdminNavCategory[] }>;

const topNavItems = [
    { label: 'Dashboard',   routeName: 'admin.dashboard',   icon: '◼' },
    { label: 'Users',       routeName: 'admin.users',       icon: '👤' },
];

const bottomNavItems = [
    { label: 'Ingredients', routeName: 'admin.ingredients', icon: '🧂' },
    { label: 'Stats',       routeName: 'admin.stats',       icon: '📊' },
    { label: 'Pages',       routeName: 'admin.pages',       icon: '📄' },
];

function NavBtn({
    active, onClick, children, indent = false,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    indent?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-2 text-sm font-medium transition-colors text-left rounded-xl',
                indent ? 'pl-7 pr-3 py-1.5' : 'px-3 py-2',
                active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
        >
            {children}
        </button>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { url, props } = usePage<AdminPageProps>();

    const categories = props.adminNavCategories ?? [];

    // Parse active group from URL (e.g. /admin/recipes?group=10-day)
    const urlPath   = url.split('?')[0];
    const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const group     = urlParams.get('group') ?? 'all';

    const onRecipesSection = urlPath.startsWith('/admin/recipes') || urlPath.startsWith('/admin/modules');

    const [recipesOpen, setRecipesOpen] = useState(false);

    const isGroupActive = (g: string) =>
        urlPath.startsWith('/admin/recipes') && group === g;

    const isRouteActive = (routeName: string) => {
        const href = route(routeName);
        return urlPath.startsWith(new URL(href, window.location.origin).pathname);
    };

    const visitGroup = (g: string) =>
        router.visit(g === 'all'
            ? route('admin.recipes')
            : `${route('admin.recipes')}?group=${g}`
        );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
                <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">Better Breakfast</p>
                </div>

                <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">

                    {/* Top items: Dashboard, Users */}
                    {topNavItems.map(({ label, routeName, icon }) => (
                        <NavBtn
                            key={routeName}
                            active={isRouteActive(routeName)}
                            onClick={() => router.visit(route(routeName))}
                        >
                            <span className="text-base leading-none">{icon}</span>
                            {label}
                        </NavBtn>
                    ))}

                    {/* ── Recipes section ─────────────────────────────── */}
                    {/* Header row: label navigates, chevron toggles */}
                    <div className={cn(
                        'flex items-center rounded-xl transition-colors',
                        onRecipesSection && group === 'all' && urlPath.startsWith('/admin/recipes')
                            ? 'bg-brand-50'
                            : 'hover:bg-gray-50',
                    )}>
                        <button
                            onClick={() => visitGroup('all')}
                            className={cn(
                                'flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium text-left transition-colors',
                                onRecipesSection && group === 'all' && urlPath.startsWith('/admin/recipes')
                                    ? 'text-brand-700'
                                    : 'text-gray-600 hover:text-gray-900',
                            )}
                        >
                            <span className="text-base leading-none">🥣</span>
                            Recipes
                        </button>
                        <button
                            onClick={() => setRecipesOpen(o => !o)}
                            className="pr-3 pl-1 py-2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={recipesOpen ? 'Collapse recipes' : 'Expand recipes'}
                        >
                            <span className={cn(
                                'inline-block text-[10px] transition-transform duration-200',
                                recipesOpen ? 'rotate-180' : '',
                            )}>▼</span>
                        </button>
                    </div>

                    {recipesOpen && (
                        <>
                            {/* 10-Day Plan sub-item */}
                            <NavBtn indent active={isGroupActive('10-day')} onClick={() => visitGroup('10-day')}>
                                10-Day Plan
                            </NavBtn>

                            {/* Dynamic premium categories */}
                            {categories.map(cat => (
                                <NavBtn
                                    key={cat.id}
                                    indent
                                    active={isGroupActive(cat.id)}
                                    onClick={() => visitGroup(cat.id)}
                                >
                                    <span className={cn(
                                        'w-1.5 h-1.5 rounded-full shrink-0',
                                        cat.isActive ? 'bg-green-400' : 'bg-gray-300',
                                    )} />
                                    <span className="truncate">{cat.name}</span>
                                </NavBtn>
                            ))}

                            {/* Separator + Modules */}
                            <div className="mx-3 my-1 border-t border-gray-100" />

                            <NavBtn
                                indent
                                active={isRouteActive('admin.modules')}
                                onClick={() => router.visit(route('admin.modules'))}
                            >
                                <span className="text-base leading-none">📦</span>
                                Modules
                            </NavBtn>
                        </>
                    )}

                    {/* Bottom items: Ingredients, Stats, Pages */}
                    {bottomNavItems.map(({ label, routeName, icon }) => (
                        <NavBtn
                            key={routeName}
                            active={isRouteActive(routeName)}
                            onClick={() => router.visit(route(routeName))}
                        >
                            <span className="text-base leading-none">{icon}</span>
                            {label}
                        </NavBtn>
                    ))}
                </nav>

                <div className="px-4 py-3 border-t border-gray-100">
                    <button
                        onClick={() => router.post(route('logout'))}
                        className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
