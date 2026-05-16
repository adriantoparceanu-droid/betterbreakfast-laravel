import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { translateContent } from '@/lib/translate';

interface ModuleRow {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    isActive: boolean;
    usersCount: number;
    translations?: { ro?: { name?: string; description?: string } } | null;
}

interface Props { modules: ModuleRow[]; }

export default function AdminModules({ modules }: Props) {
    const [editing, setEditing] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', description: '', price: '', trName: '', trDescription: '' });
    const [translating, setTranslating] = useState(false);

    const startEdit = (m: ModuleRow) => {
        setEditing(m.id);
        setForm({
            name: m.name, description: m.description, price: String(m.price),
            trName: m.translations?.ro?.name ?? '',
            trDescription: m.translations?.ro?.description ?? '',
        });
    };

    const generateRo = async () => {
        setTranslating(true);
        const res = await translateContent<{ name?: string; description?: string }>('module', {
            name: form.name, description: form.description,
        });
        setTranslating(false);
        if (res.ok) {
            setForm((f) => ({ ...f, trName: res.translation.name ?? '', trDescription: res.translation.description ?? '' }));
        } else {
            alert(res.error);
        }
    };

    const save = (id: string) => {
        const ro: Record<string, string> = {};
        if (form.trName.trim()) ro.name = form.trName.trim();
        if (form.trDescription.trim()) ro.description = form.trDescription.trim();
        router.patch(route('admin.modules.update', { id }), {
            name: form.name,
            description: form.description,
            price: parseFloat(form.price),
            translations: Object.keys(ro).length ? { ro } : null,
        }, { onSuccess: () => setEditing(null) });
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Modules</h1>
                    <p className="text-sm text-gray-400">Manage available plans</p>
                </div>
            </div>

            <div className="grid gap-4">
                {modules.map((m) => (
                    <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                        {editing === m.id ? (
                            <div className="flex flex-col gap-3">
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Name" />
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" rows={2} placeholder="Description" />
                                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    type="number" step="0.01" className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-32" placeholder="Price" />

                                <div className="border-t border-gray-100 pt-3 mt-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Translation · RO</p>
                                        <button type="button" onClick={generateRo} disabled={translating}
                                            className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                                            {translating ? 'Generating…' : 'Generate with AI'}
                                        </button>
                                    </div>
                                    <input value={form.trName} onChange={(e) => setForm({ ...form, trName: e.target.value })}
                                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full mb-2" placeholder="Nume (RO)" />
                                    <textarea value={form.trDescription} onChange={(e) => setForm({ ...form, trDescription: e.target.value })}
                                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none w-full" rows={2} placeholder="Descriere (RO)" />
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => save(m.id)}
                                        className="px-4 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors">
                                        Save
                                    </button>
                                    <button onClick={() => setEditing(null)}
                                        className="px-4 py-1.5 border border-gray-200 text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                                            m.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {m.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-2">{m.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>Slug: <code className="font-mono bg-gray-50 px-1 rounded">{m.slug}</code></span>
                                        <span>Price: <strong>${m.price}</strong></span>
                                        <span>{m.usersCount} users</span>
                                    </div>
                                </div>
                                <button onClick={() => startEdit(m)}
                                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-500 font-medium">Future modules</p>
                <p className="text-xs text-gray-400 mt-1">
                    New plans will appear here once created in the database.
                </p>
            </div>
        </div>
    );
}

AdminModules.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
