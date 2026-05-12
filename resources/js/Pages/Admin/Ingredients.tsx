import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface IngredientRow {
    id: number;
    name: string;
    category: string;
    unit: string;
    notes: string | null;
}

interface Props { ingredients: IngredientRow[]; }

const EMPTY_FORM = { name: '', category: '', unit: '', notes: '' };

export default function AdminIngredients({ ingredients }: Props) {
    const [search, setSearch]   = useState('');
    const [adding, setAdding]   = useState(false);
    const [newForm, setNewForm] = useState(EMPTY_FORM);

    const filtered = ingredients.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()),
    );

    const handleAdd = () => {
        router.post(route('admin.ingredients.store'), newForm, {
            onSuccess: () => { setAdding(false); setNewForm(EMPTY_FORM); },
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Delete "${name}"?`)) {
            router.delete(route('admin.ingredients.destroy', { id }));
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Ingredients</h1>
                    <p className="text-sm text-gray-400">{ingredients.length} ingredients in master list</p>
                </div>
                <button onClick={() => setAdding(true)}
                    className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors">
                    + Add ingredient
                </button>
            </div>

            {adding && (
                <div className="bg-white border border-brand-200 rounded-2xl p-4 mb-4 grid grid-cols-4 gap-3 items-end">
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Name</label>
                        <input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="e.g. Oats" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
                        <input value={newForm.category} onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="e.g. Grains" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Unit</label>
                        <input value={newForm.unit} onChange={(e) => setNewForm({ ...newForm, unit: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="e.g. g" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd}
                            className="flex-1 px-3 py-2 bg-brand-500 text-white text-xs font-medium rounded-xl hover:bg-brand-600 transition-colors">
                            Save
                        </button>
                        <button onClick={() => setAdding(false)}
                            className="px-3 py-2 border border-gray-200 text-xs font-medium rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-sm border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    placeholder="Search ingredients…" />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-xs text-gray-500">
                            <th className="text-left px-5 py-3 font-medium">Name</th>
                            <th className="text-left px-5 py-3 font-medium">Category</th>
                            <th className="text-left px-5 py-3 font-medium">Unit</th>
                            <th className="text-left px-5 py-3 font-medium">Notes</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No ingredients found.</td>
                            </tr>
                        ) : (
                            filtered.map((i) => (
                                <tr key={i.id}>
                                    <td className="px-5 py-3 font-medium text-gray-900">{i.name}</td>
                                    <td className="px-5 py-3 text-gray-500">{i.category}</td>
                                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{i.unit}</td>
                                    <td className="px-5 py-3 text-gray-400 text-xs">{i.notes ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        <button onClick={() => handleDelete(i.id, i.name)}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

AdminIngredients.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
