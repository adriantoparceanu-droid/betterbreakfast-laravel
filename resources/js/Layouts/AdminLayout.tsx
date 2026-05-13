import { router, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Dashboard',   routeName: 'admin.dashboard',   icon: '◼' },
    { label: 'Users',       routeName: 'admin.users',       icon: '👤' },
    { label: 'Recipes',     routeName: 'admin.recipes',     icon: '🥣' },
    { label: 'Ingredients', routeName: 'admin.ingredients', icon: '🧂' },
    { label: 'Modules',     routeName: 'admin.modules',     icon: '📦' },
    { label: 'Categories',  routeName: 'admin.categories',  icon: '🏷️' },
    { label: 'Stats',       routeName: 'admin.stats',       icon: '📊' },
    { label: 'Pages',       routeName: 'admin.pages',       icon: '📄' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { url } = usePage();

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
                <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">Better Breakfast</p>
                </div>
                <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
                    {navItems.map(({ label, routeName, icon }) => {
                        const href = route(routeName);
                        const isActive = url.startsWith(new URL(href, window.location.origin).pathname);
                        return (
                            <button
                                key={routeName}
                                onClick={() => router.visit(href)}
                                className={cn(
                                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left',
                                    isActive
                                        ? 'bg-brand-50 text-brand-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                )}
                            >
                                <span className="text-base leading-none">{icon}</span>
                                {label}
                            </button>
                        );
                    })}
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
