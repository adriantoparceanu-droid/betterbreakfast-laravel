import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const INGREDIENT_CATEGORIES = [
    'Proteins', 'Grains', 'Dairy', 'Fruits',
    'Vegetables', 'Seeds & Nuts', 'Condiments',
] as const;

interface IngredientRow {
    id: number;
    name: string;
    category: string;
    caloriesPer100g: number | null;
    proteinPer100g:  number | null;
    fatPer100g:      number | null;
    carbsPer100g:    number | null;
    fiberPer100g:    number | null;
}

type NutritionKey = 'caloriesPer100g' | 'proteinPer100g' | 'fatPer100g' | 'carbsPer100g' | 'fiberPer100g';

const NUTRITION_COLS: { key: NutritionKey; label: string; server: string }[] = [
    { key: 'caloriesPer100g', label: 'kcal', server: 'calories_per_100g' },
    { key: 'proteinPer100g',  label: 'Prot', server: 'protein_per_100g'  },
    { key: 'fatPer100g',      label: 'Fat',  server: 'fat_per_100g'      },
    { key: 'carbsPer100g',    label: 'Carbs',server: 'carbs_per_100g'    },
    { key: 'fiberPer100g',    label: 'Fiber',server: 'fiber_per_100g'    },
];

interface Props { ingredients: IngredientRow[]; }

const EMPTY_ADD = { name: '', category: 'Grains' as string, calories_per_100g: '', protein_per_100g: '', fat_per_100g: '', carbs_per_100g: '', fiber_per_100g: '' };

const INPUT_CLS = 'w-full h-8 border border-gray-200 rounded-lg px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400';
const NUM_CLS   = `${INPUT_CLS} text-center`;

export default function AdminIngredients({ ingredients }: Props) {
    const [search,    setSearch]   = useState('');
    const [adding,    setAdding]   = useState(false);
    const [newForm,   setNewForm]  = useState(EMPTY_ADD);
    const [editingId, setEditing]  = useState<number | null>(null);
    const [editForm,  setEditForm] = useState<Partial<Record<string, string>>>({});

    const filtered = ingredients.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()),
    );

    // ─── Add ──────────────────────────────────────────────────────────────────

    const handleAdd = () => {
        router.post(route('admin.ingredients.store'), newForm, {
            onSuccess: () => { setAdding(false); setNewForm(EMPTY_ADD); },
        });
    };

    // ─── Edit ─────────────────────────────────────────────────────────────────

    const startEdit = (i: IngredientRow) => {
        setEditing(i.id);
        setEditForm({
            name:               i.name,
            category:           i.category,
            calories_per_100g:  i.caloriesPer100g?.toString() ?? '',
            protein_per_100g:   i.proteinPer100g?.toString()  ?? '',
            fat_per_100g:       i.fatPer100g?.toString()      ?? '',
            carbs_per_100g:     i.carbsPer100g?.toString()    ?? '',
            fiber_per_100g:     i.fiberPer100g?.toString()    ?? '',
        });
    };

    const saveEdit = (id: number) => {
        router.patch(route('admin.ingredients.update', { id }), editForm, {
            onSuccess: () => setEditing(null),
        });
    };

    // ─── Delete ───────────────────────────────────────────────────────────────

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Delete "${name}"?`)) {
            router.delete(route('admin.ingredients.destroy', { id }));
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Ingredients</h1>
                    <p className="text-sm text-gray-400">{ingredients.length} ingredients in master list</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.post(route('admin.ingredients.seed'))}
                        className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Seed from recipes
                    </button>
                    <button
                        onClick={() => setAdding(true)}
                        className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors"
                    >
                        + Add ingredient
                    </button>
                </div>
            </div>

            {/* Add form */}
            {adding && (
                <div className="bg-white border border-brand-200 rounded-2xl p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">New ingredient</p>
                    <div className="grid grid-cols-[1fr_1fr_repeat(5,6rem)] gap-3 items-end mb-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Name</label>
                            <input
                                value={newForm.name}
                                onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                                className={INPUT_CLS}
                                placeholder="e.g. Rolled oats"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
                            <select
                                value={newForm.category}
                                onChange={e => setNewForm({ ...newForm, category: e.target.value })}
                                className={INPUT_CLS}
                            >
                                {INGREDIENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {NUTRITION_COLS.map(col => (
                            <div key={col.key}>
                                <label className="text-xs font-medium text-gray-500 block mb-1 text-center">{col.label} /100g</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={(newForm as Record<string, string>)[col.server] ?? ''}
                                    onChange={e => setNewForm({ ...newForm, [col.server]: e.target.value })}
                                    className={NUM_CLS}
                                    placeholder="—"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => { setAdding(false); setNewForm(EMPTY_ADD); }}
                            className="px-4 py-2 border border-gray-200 text-xs font-medium rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                        >Cancel</button>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-brand-500 text-white text-xs font-medium rounded-xl hover:bg-brand-600 transition-colors"
                        >Save</button>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-4">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-sm border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="Search ingredients…"
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-xs text-gray-500">
                            <th className="text-left px-5 py-3 font-medium">Name</th>
                            <th className="text-left px-5 py-3 font-medium">Category</th>
                            {NUTRITION_COLS.map(col => (
                                <th key={col.key} className="text-center px-3 py-3 font-medium">{col.label}<br /><span className="font-normal text-gray-400">/100g</span></th>
                            ))}
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-5 py-8 text-center text-gray-400">No ingredients found.</td>
                            </tr>
                        ) : filtered.map((i) => (
                            editingId === i.id ? (
                                /* Edit row */
                                <tr key={i.id} className="bg-brand-50/40">
                                    <td className="px-5 py-2">
                                        <input
                                            value={editForm.name ?? ''}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className={INPUT_CLS}
                                        />
                                    </td>
                                    <td className="px-5 py-2">
                                        <select
                                            value={editForm.category ?? ''}
                                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                            className={INPUT_CLS}
                                        >
                                            {INGREDIENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </td>
                                    {NUTRITION_COLS.map(col => (
                                        <td key={col.key} className="px-3 py-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={editForm[col.server] ?? ''}
                                                onChange={e => setEditForm({ ...editForm, [col.server]: e.target.value })}
                                                className={NUM_CLS}
                                                placeholder="—"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-5 py-2">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <button
                                                onClick={() => saveEdit(i.id)}
                                                className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                                            >Save</button>
                                            <button
                                                onClick={() => setEditing(null)}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                            >Cancel</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                /* Read row */
                                <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3 font-medium text-gray-900">{i.name}</td>
                                    <td className="px-5 py-3 text-gray-500">{i.category}</td>
                                    {NUTRITION_COLS.map(col => (
                                        <td key={col.key} className="px-3 py-3 text-center text-xs text-gray-600">
                                            {i[col.key] !== null ? i[col.key] : <span className="text-gray-300">—</span>}
                                        </td>
                                    ))}
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <button
                                                onClick={() => startEdit(i)}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                            >Edit</button>
                                            <button
                                                onClick={() => handleDelete(i.id, i.name)}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                                            >Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

AdminIngredients.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
