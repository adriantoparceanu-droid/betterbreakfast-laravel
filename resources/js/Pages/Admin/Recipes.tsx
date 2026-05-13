import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { Nutrition, Ingredient } from '@/types/app';

interface RecipeRow {
    id: string;
    name: string;
    image: string;
    baseServings: number;
    ingredients: Ingredient[];
    steps: string[];
    nutrition: Nutrition;
    tags: string[];
    isActive: boolean;
    sortOrder: number;
    module: { id: string; name: string; slug: string } | null;
    category: { id: string; name: string } | null;
}

interface ModuleOption   { id: string; name: string; }
interface CategoryOption { id: string; name: string; module_id: string; }

interface Props { recipes: RecipeRow[]; modules: ModuleOption[]; categories: CategoryOption[]; }

export default function AdminRecipes({ recipes, modules, categories }: Props) {
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [filterModule,   setFilterModule]   = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus,   setFilterStatus]   = useState('');

    const toggle  = (id: string) => router.patch(route('admin.recipes.toggle', { id }));
    const destroy = (id: string) => router.delete(route('admin.recipes.destroy', { id }), {
        onSuccess: () => setConfirmDelete(null),
    });

    const visibleCategories = filterModule
        ? categories.filter(c => c.module_id === filterModule)
        : categories;

    const filtered = recipes.filter(r => {
        if (filterModule   && r.module?.id   !== filterModule)   return false;
        if (filterCategory && r.category?.id !== filterCategory) return false;
        if (filterStatus === 'active'   && !r.isActive) return false;
        if (filterStatus === 'inactive' &&  r.isActive) return false;
        return true;
    });

    const hasFilter = filterModule || filterCategory || filterStatus;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Recipes</h1>
                    <p className="text-sm text-gray-400">
                        {hasFilter ? `${filtered.length} of ${recipes.length}` : recipes.length} recipes
                    </p>
                </div>
                <Button size="sm" onClick={() => router.visit(route('admin.recipes.create'))}>
                    + Add Recipe
                </Button>
            </div>

            {/* ─── Filters ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                <select
                    value={filterModule}
                    onChange={e => { setFilterModule(e.target.value); setFilterCategory(''); }}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                    <option value="">All modules</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                    <option value="">All categories</option>
                    {visibleCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>

                {hasFilter && (
                    <button
                        onClick={() => { setFilterModule(''); setFilterCategory(''); setFilterStatus(''); }}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-xs text-gray-500">
                            <th className="text-left px-5 py-3 font-medium">#</th>
                            <th className="text-left px-5 py-3 font-medium">Recipe</th>
                            <th className="text-left px-5 py-3 font-medium">Nutrition</th>
                            <th className="text-left px-5 py-3 font-medium">Module / Category</th>
                            <th className="text-left px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                                    No recipes match the selected filters.
                                </td>
                            </tr>
                        )}
                        {filtered.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3 text-gray-400 font-mono text-xs">{r.sortOrder}</td>
                                <td className="px-5 py-3">
                                    <p className="font-medium text-gray-900">{r.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{r.tags.join(', ')}</p>
                                </td>
                                <td className="px-5 py-3 text-xs text-gray-500">
                                    {r.nutrition.calories} kcal · {r.nutrition.protein}g P · {r.nutrition.carbs}g C · {r.nutrition.fat}g F
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-col gap-1">
                                        {r.module ? (
                                            <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 w-fit">
                                                {r.module.name}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                        {r.category && (
                                            <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 w-fit">
                                                {r.category.name}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                                        r.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {r.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => toggle(r.id)}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            {r.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => router.visit(route('admin.recipes.edit', { id: r.id }))}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        {confirmDelete === r.id ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-xs text-gray-500">Sure?</span>
                                                <button
                                                    onClick={() => destroy(r.id)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                >Yes</button>
                                                <button
                                                    onClick={() => setConfirmDelete(null)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                                >No</button>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDelete(r.id)}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

AdminRecipes.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
