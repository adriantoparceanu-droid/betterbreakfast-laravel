import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import type { Nutrition, Ingredient } from '@/types/app';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ModuleOption { id: string; name: string; }

interface CategoryFull {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    sortOrder: number;
    isActive: boolean;
    recipesCount: number;
    moduleId: string;
}

interface EditCatForm {
    name: string;
    description: string;
    price: string;
    sort_order: string;
}

interface Props {
    recipes: RecipeRow[];
    modules: ModuleOption[];
    categories: CategoryFull[];
}

type GroupId = 'all' | '10-day' | string;

// ─── Add Category Modal ───────────────────────────────────────────────────────

const FIELD = 'h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500';

function AddCategoryModal({ modules, onClose }: { modules: ModuleOption[]; onClose: () => void }) {
    const [form, setForm] = useState({
        name: '', module_id: modules[0]?.id ?? '',
        description: '', price: '3.99', sort_order: '10',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('admin.categories.store'), {
            ...form,
            price: parseFloat(form.price),
            sort_order: parseInt(form.sort_order, 10),
        }, { onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Add Category</h2>
                    <button type="button" onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-700 leading-none">×</button>
                </div>
                <form onSubmit={submit}>
                    <div className="px-6 py-5 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Module</label>
                            <select value={form.module_id} onChange={e => setForm({ ...form, module_id: e.target.value })} className={FIELD}>
                                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. High Protein" required />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={2}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                placeholder="Short description…"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Price (€)" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                            <Input label="Sort Order" type="number" min="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Add Category</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Category metadata bar ────────────────────────────────────────────────────

function CategoryBar({
    cat, onToggle,
}: {
    cat: CategoryFull;
    onToggle: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState<EditCatForm>({
        name: cat.name, description: cat.description ?? '',
        price: String(cat.price), sort_order: String(cat.sortOrder),
    });

    const save = () =>
        router.patch(route('admin.categories.update', { id: cat.id }), {
            name: form.name,
            description: form.description,
            price: parseFloat(form.price),
            sort_order: parseInt(form.sort_order, 10),
        }, { onSuccess: () => setEditing(false) });

    if (editing) {
        return (
            <div className="mb-4 px-4 py-3 bg-purple-50 rounded-xl border border-purple-100 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Name</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        className="h-8 rounded-lg border border-gray-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-44" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Description</label>
                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        className="h-8 rounded-lg border border-gray-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-52" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Price €</label>
                    <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                        className="h-8 rounded-lg border border-gray-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-20" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Order</label>
                    <input type="number" min="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })}
                        className="h-8 rounded-lg border border-gray-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-16" />
                </div>
                <div className="flex gap-2 ml-auto">
                    <button onClick={save} className="h-8 px-4 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors">Save</button>
                    <button onClick={() => setEditing(false)} className="h-8 px-4 border border-gray-200 bg-white text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-purple-50 rounded-xl border border-purple-100">
            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium shrink-0 ${
                cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
                {cat.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-sm font-semibold text-purple-800 shrink-0">€{cat.price.toFixed(2)}</span>
            {cat.description && (
                <span className="text-xs text-gray-500 flex-1 truncate">{cat.description}</span>
            )}
            <span className="text-xs text-gray-400 font-mono shrink-0">{cat.slug}</span>
            <div className="flex items-center gap-2 ml-auto shrink-0">
                <button onClick={() => setEditing(true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                    Edit
                </button>
                <button onClick={onToggle}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                    {cat.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminRecipes({ recipes, modules, categories }: Props) {
    const { url } = usePage();

    // Derive selected group from URL query param
    const groupParam = (new URLSearchParams(url.includes('?') ? url.split('?')[1] : '')
        .get('group') ?? 'all') as GroupId;

    const [addingCategory, setAddingCategory]               = useState(false);
    const [confirmDeleteRecipe, setConfirmDeleteRecipe]     = useState<string | null>(null);

    // ── Derived ──────────────────────────────────────────────────────────────

    const filteredRecipes = (() => {
        if (groupParam === 'all')    return recipes;
        if (groupParam === '10-day') return recipes.filter(r => r.module !== null && r.category === null);
        return recipes.filter(r => r.category?.id === groupParam);
    })();

    const selectedCategory = groupParam !== 'all' && groupParam !== '10-day'
        ? categories.find(c => c.id === groupParam) ?? null
        : null;

    const groupLabel = groupParam === 'all'    ? 'All Recipes'
                     : groupParam === '10-day' ? '10-Day Plan'
                     : selectedCategory?.name  ?? 'Recipes';

    const showGroupCol = groupParam === 'all';
    const colSpan      = showGroupCol ? 6 : 5;

    // ── Actions ──────────────────────────────────────────────────────────────

    const toggleRecipe = (id: string) => router.patch(route('admin.recipes.toggle', { id }));

    const deleteRecipe = (id: string) =>
        router.delete(route('admin.recipes.destroy', { id }), {
            onSuccess: () => setConfirmDeleteRecipe(null),
        });

    const toggleCategory = (id: string) => router.patch(route('admin.categories.toggle', { id }));

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{groupLabel}</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setAddingCategory(true)}>
                        + Add Category
                    </Button>
                    <Button size="sm" onClick={() => router.visit(route('admin.recipes.create'))}>
                        + Add Recipe
                    </Button>
                </div>
            </div>

            {/* Category metadata bar */}
            {selectedCategory && (
                <CategoryBar
                    cat={selectedCategory}
                    onToggle={() => toggleCategory(selectedCategory.id)}
                />
            )}

            {/* Recipes table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-xs text-gray-500">
                            <th className="text-left px-4 py-3 font-medium w-10">#</th>
                            <th className="text-left px-4 py-3 font-medium">Recipe</th>
                            <th className="text-left px-4 py-3 font-medium">Nutrition</th>
                            {showGroupCol && <th className="text-left px-4 py-3 font-medium">Group</th>}
                            <th className="text-left px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 w-64" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredRecipes.length === 0 && (
                            <tr>
                                <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-gray-400">
                                    No recipes in this group yet.
                                </td>
                            </tr>
                        )}
                        {filteredRecipes.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.sortOrder}</td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900">{r.name}</p>
                                    {r.tags.length > 0 && (
                                        <p className="text-xs text-gray-400 mt-0.5">{r.tags.join(', ')}</p>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                    {r.nutrition.calories} kcal · {r.nutrition.protein}g P · {r.nutrition.carbs}g C · {r.nutrition.fat}g F
                                </td>
                                {showGroupCol && (
                                    <td className="px-4 py-3">
                                        {r.module && (
                                            <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                                                {r.module.name}
                                            </span>
                                        )}
                                        {r.category && (
                                            <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700">
                                                {r.category.name}
                                            </span>
                                        )}
                                        {!r.module && !r.category && (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                )}
                                <td className="px-4 py-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                                        r.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {r.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => toggleRecipe(r.id)}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                                        >
                                            {r.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => router.visit(route('admin.recipes.edit', { id: r.id }))}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        {confirmDeleteRecipe === r.id ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-xs text-gray-500">Sure?</span>
                                                <button onClick={() => deleteRecipe(r.id)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">Yes</button>
                                                <button onClick={() => setConfirmDeleteRecipe(null)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">No</button>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeleteRecipe(r.id)}
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

            {addingCategory && (
                <AddCategoryModal modules={modules} onClose={() => setAddingCategory(false)} />
            )}
        </div>
    );
}

AdminRecipes.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
