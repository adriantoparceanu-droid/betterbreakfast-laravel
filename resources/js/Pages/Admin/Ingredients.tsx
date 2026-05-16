import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { translateContent } from '@/lib/translate';

const INGREDIENT_CATEGORIES = [
    'Proteins', 'Grains & Legumes', 'Dairy', 'Fruits',
    'Vegetables', 'Fats, Nuts & Seeds', 'Condiments',
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
    translationRo:   string | null;
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

const EMPTY_ADD = { name: '', category: 'Grains & Legumes' as string, translation_ro_name: '', calories_per_100g: '', protein_per_100g: '', fat_per_100g: '', carbs_per_100g: '', fiber_per_100g: '' };

const INPUT_CLS = 'w-full h-8 border border-gray-200 rounded-lg px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400';
const NUM_CLS   = `${INPUT_CLS} text-center`;

interface NutritionResult {
    foundName: string | null;
    calories: number | null;
    protein:  number | null;
    fat:      number | null;
    carbs:    number | null;
    fiber:    number | null;
}

export default function AdminIngredients({ ingredients }: Props) {
    const [search,        setSearch]        = useState('');
    const [adding,        setAdding]        = useState(false);
    const [newForm,       setNewForm]       = useState(EMPTY_ADD);
    const [editingId,     setEditing]       = useState<number | null>(null);
    const [editForm,      setEditForm]      = useState<Partial<Record<string, string>>>({});
    const [lookupLoading, setLookupLoading] = useState<'add' | number | null>(null);
    const [lookupError,   setLookupError]   = useState<{ ctx: 'add' | number; msg: string } | null>(null);
    const [bulkProgress,  setBulkProgress]  = useState<{ done: number; total: number; skipped: number } | null>(null);
    const [trLoading,     setTrLoading]     = useState<'add' | number | null>(null);

    const generateRo = async (name: string, ctx: 'add' | number) => {
        if (!name.trim()) return;
        setTrLoading(ctx);
        const res = await translateContent<{ name?: string }>('ingredient', { name: name.trim() });
        setTrLoading(null);
        if (!res.ok) { alert(res.error); return; }
        if (ctx === 'add') setNewForm(prev => ({ ...prev, translation_ro_name: res.translation.name ?? '' }));
        else setEditForm(prev => ({ ...prev, translation_ro_name: res.translation.name ?? '' }));
    };

    const filtered = ingredients.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()),
    );

    // ─── CSRF token helper ────────────────────────────────────────────────────

    function getCsrf(): string {
        return decodeURIComponent(
            document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''
        );
    }

    // ─── Bulk lookup all ingredients ──────────────────────────────────────────

    async function handleLookupAll() {
        if (bulkProgress !== null) return;
        setBulkProgress({ done: 0, total: ingredients.length, skipped: 0 });
        let skipped = 0;

        for (let idx = 0; idx < ingredients.length; idx++) {
            const ing = ingredients[idx];
            try {
                const lookupUrl = route('admin.ingredients.nutrition_lookup') + '?name=' + encodeURIComponent(ing.name);
                const res  = await fetch(lookupUrl, { credentials: 'same-origin' });
                const data = await res.json() as NutritionResult & { error?: string };

                if (!res.ok || data.error) {
                    skipped++;
                } else {
                    const patchUrl = route('admin.ingredients.update', { id: ing.id });
                    await fetch(patchUrl, {
                        method: 'PATCH',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': getCsrf(),
                        },
                        body: JSON.stringify({
                            calories_per_100g: data.calories,
                            protein_per_100g:  data.protein,
                            fat_per_100g:      data.fat,
                            carbs_per_100g:    data.carbs,
                            fiber_per_100g:    data.fiber,
                        }),
                    });
                }
            } catch {
                skipped++;
            }
            setBulkProgress({ done: idx + 1, total: ingredients.length, skipped });
        }

        router.reload();
        setBulkProgress(null);
    }

    // ─── Nutrition lookup ─────────────────────────────────────────────────────

    const handleLookup = async (name: string, ctx: 'add' | number) => {
        if (!name.trim()) return;
        setLookupLoading(ctx);
        setLookupError(null);

        try {
            const url = route('admin.ingredients.nutrition_lookup') + '?name=' + encodeURIComponent(name.trim());
            const res = await fetch(url, { credentials: 'same-origin' });
            const data: NutritionResult & { error?: string } = await res.json();

            if (!res.ok || data.error) {
                setLookupError({ ctx, msg: data.error ?? 'Not found' });
                return;
            }

            const patch = {
                calories_per_100g: data.calories?.toString() ?? '',
                protein_per_100g:  data.protein?.toString()  ?? '',
                fat_per_100g:      data.fat?.toString()       ?? '',
                carbs_per_100g:    data.carbs?.toString()     ?? '',
                fiber_per_100g:    data.fiber?.toString()     ?? '',
            };

            if (ctx === 'add') {
                setNewForm(prev => ({ ...prev, ...patch }));
            } else {
                setEditForm(prev => ({ ...prev, ...patch }));
            }
        } catch {
            setLookupError({ ctx, msg: 'Network error' });
        } finally {
            setLookupLoading(null);
        }
    };

    // ─── Add ──────────────────────────────────────────────────────────────────

    const handleAdd = () => {
        router.post(route('admin.ingredients.store'), newForm, {
            onSuccess: () => { setAdding(false); setNewForm(EMPTY_ADD); },
        });
    };

    // ─── Edit ─────────────────────────────────────────────────────────────────

    const startEdit = (i: IngredientRow) => {
        setEditing(i.id);
        setLookupError(null);
        setEditForm({
            name:               i.name,
            category:           i.category,
            translation_ro_name: i.translationRo ?? '',
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

    // ─── Lookup button ────────────────────────────────────────────────────────

    const LookupBtn = ({ name, ctx }: { name: string; ctx: 'add' | number }) => (
        <button
            type="button"
            onClick={() => handleLookup(name, ctx)}
            disabled={!name.trim() || lookupLoading === ctx}
            className="shrink-0 h-8 px-2.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
            {lookupLoading === ctx ? '…' : 'Lookup'}
        </button>
    );

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
                        onClick={handleLookupAll}
                        disabled={bulkProgress !== null}
                        className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        {bulkProgress !== null
                            ? `Lookup All… ${bulkProgress.done}/${bulkProgress.total}`
                            : 'Lookup All'}
                    </button>
                    <button
                        onClick={() => setAdding(true)}
                        className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors"
                    >
                        + Add ingredient
                    </button>
                </div>
            </div>

            {bulkProgress !== null && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                    <div className="flex-1 bg-blue-100 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                            style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-blue-700 font-medium whitespace-nowrap">
                        {bulkProgress.done}/{bulkProgress.total}
                        {bulkProgress.skipped > 0 && ` · ${bulkProgress.skipped} skipped`}
                    </span>
                </div>
            )}

            {/* Add form */}
            {adding && (
                <div className="bg-white border border-brand-200 rounded-2xl p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">New ingredient</p>
                    <div className="grid grid-cols-[1fr_1fr_repeat(5,6rem)] gap-3 items-end mb-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Name</label>
                            <div className="flex gap-1">
                                <input
                                    value={newForm.name}
                                    onChange={e => { setNewForm({ ...newForm, name: e.target.value }); setLookupError(null); }}
                                    className={INPUT_CLS}
                                    placeholder="e.g. Rolled oats"
                                />
                                <LookupBtn name={newForm.name} ctx="add" />
                            </div>
                            {lookupError?.ctx === 'add' && (
                                <p className="text-xs text-red-500 mt-1">{lookupError.msg}</p>
                            )}
                            <div className="flex gap-1 mt-1">
                                <input
                                    value={newForm.translation_ro_name}
                                    onChange={e => setNewForm({ ...newForm, translation_ro_name: e.target.value })}
                                    className={INPUT_CLS}
                                    placeholder="Nume (RO)"
                                />
                                <button type="button" onClick={() => generateRo(newForm.name, 'add')} disabled={trLoading === 'add'}
                                    className="shrink-0 px-2 h-8 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                                    {trLoading === 'add' ? '…' : 'AI'}
                                </button>
                            </div>
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
                            onClick={() => { setAdding(false); setNewForm(EMPTY_ADD); setLookupError(null); }}
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
                                        <div className="flex gap-1">
                                            <input
                                                value={editForm.name ?? ''}
                                                onChange={e => { setEditForm({ ...editForm, name: e.target.value }); setLookupError(null); }}
                                                className={INPUT_CLS}
                                            />
                                            <LookupBtn name={editForm.name ?? ''} ctx={i.id} />
                                        </div>
                                        {lookupError?.ctx === i.id && (
                                            <p className="text-xs text-red-500 mt-1">{lookupError.msg}</p>
                                        )}
                                        <div className="flex gap-1 mt-1">
                                            <input
                                                value={editForm.translation_ro_name ?? ''}
                                                onChange={e => setEditForm({ ...editForm, translation_ro_name: e.target.value })}
                                                className={INPUT_CLS}
                                                placeholder="Nume (RO)"
                                            />
                                            <button type="button" onClick={() => generateRo(editForm.name ?? '', i.id)} disabled={trLoading === i.id}
                                                className="shrink-0 px-2 h-8 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                                                {trLoading === i.id ? '…' : 'AI'}
                                            </button>
                                        </div>
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
