import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import RichTextEditor from '@/Components/ui/RichTextEditor';

interface Props {
    privacy_policy: string;
    flash?: { success?: string };
}

function AdminPages({ privacy_policy, flash }: Props) {
    const [content, setContent] = useState(privacy_policy);
    const [saving, setSaving] = useState(false);

    function save() {
        setSaving(true);
        router.put(route('admin.pages.update'), { privacy_policy: content }, {
            onFinish: () => setSaving(false),
        });
    }

    return (
        <div className="p-8 max-w-3xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Editable public pages</p>
                </div>
                <button
                    onClick={save}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>

            {flash?.success && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">Privacy Policy</h2>
                    <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 hover:underline"
                    >
                        Preview ↗
                    </a>
                </div>
                <RichTextEditor value={content} onChange={setContent} />
            </div>
        </div>
    );
};

AdminPages.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
export default AdminPages;
