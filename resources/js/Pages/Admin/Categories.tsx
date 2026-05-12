import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';

interface CategoryRow {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    sortOrder: number;
    isActive: boolean;
    recipesCount: number;
    module: { id: string; name: string } | null;
}

interface ModuleOption { id: string; name: string; }

interface Props {
    categories: CategoryRow[];
    modules: ModuleOption[];
}

const FIELD_CLS = 'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500';

function AddModal({ modules, onClose }: { modules: ModuleOption[]; onClose: () => void }) {
    const [form, setForm] = useState({ name: '', module_id: modules[0]?.id ?? '', description: '', price: '0', sort_order: '10' });

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
                    <button type="button" onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-700">×</button>
                </div>
                <form onSubmit={submit}>
                    <div className="px-6 py-5 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Module</label>
                            <select value={form.module_id} onChange={e => setForm({ ...form, module_id: e.target.value })} className={FIELD_CLS}>
                                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. High Protein" required />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={2} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                placeholder="Short description..." />
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

export default function AdminCategories({ categories, modules }: Props) {
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', price: '', sort_order: '' });
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const startEdit = (c: CategoryRow) => {
        setEditing(c.id);
        setEditForm({ name: c.name, description: c.description ?? '', price: String(c.price), sort_order: String(c.sortOrder) });
    };

    const saveEdit = (id: string) => {
        router.patch(route('admin.categories.update', { id }), {
            name: editForm.name,
            description: editForm.description,
            price: parseFloat(editForm.price),
            sort_order: parseInt(editForm.sort_order, 10),
        }, { onSuccess: () => setEditing(null) });
    };

    const toggle = (id: string) => router.patch(route('admin.categories.toggle', { id }));

    const destroy = (id: string) => router.delete(route('admin.categories.destroy', { id }), {
        onSuccess: () => setConfirmDelete(null),
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Categories</h1>
                    <p className="text-sm text-gray-400">Premium recipe categories — each sold separately</p>
                </div>
                <Button size="sm" onClick={() => setAdding(true)}>+ Add Category</Button>
            </div>

            <div className="grid gap-4">
                {categories.length === 0 && (
                    <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                        <p className="text-sm text-gray-500">No categories yet. Click "Add Category" to create the first one.</p>
                    </div>
                )}
                {categories.map((c) => (
                    <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                        {editing === c.id ? (
                            <div className="flex flex-col gap-3">
                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Name" />
                                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" rows={2} placeholder="Description" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                        type="number" step="0.01" min="0" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Price" />
                                    <input value={editForm.sort_order} onChange={e => setEditForm({ ...editForm, sort_order: e.target.value })}
                                        type="number" min="0" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Sort order" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => saveEdit(c.id)} className="px-4 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors">Save</button>
                                    <button onClick={() => setEditing(null)} className="px-4 py-1.5 border border-gray-200 text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {c.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    {c.description && <p className="text-xs text-gray-400 mb-2">{c.description}</p>}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>Module: <strong>{c.module?.name ?? '—'}</strong></span>
                                        <span>Price: <strong>€{c.price.toFixed(2)}</strong></span>
                                        <span><strong>{c.recipesCount}</strong> recipes</span>
                                        <span className="font-mono bg-gray-50 px-1 rounded">{c.slug}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => toggle(c.id)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                        {c.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onClick={() => startEdit(c)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                        Edit
                                    </button>
                                    {confirmDelete === c.id ? (
                                        <span className="flex items-center gap-1.5">
                                            <span className="text-xs text-gray-500">Sure?</span>
                                            <button onClick={() => destroy(c.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">Yes</button>
                                            <button onClick={() => setConfirmDelete(null)} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">No</button>
                                        </span>
                                    ) : (
                                        <button onClick={() => setConfirmDelete(c.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {adding && <AddModal modules={modules} onClose={() => setAdding(false)} />}
        </div>
    );
}

AdminCategories.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
