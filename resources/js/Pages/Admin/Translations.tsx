import { useState, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { cn } from '@/lib/utils';

interface UiTranslationRecord {
    id: number;
    locale: string;
    key: string;
    value: string;
    updated_at: string;
}

interface Props {
    translations: UiTranslationRecord[];
}

interface GroupRow {
    key: string;
    enId: number | null;
    roId: number | null;
    enValue: string;
    roValue: string;
}

const NAMESPACE_LABELS: Record<string, string> = {
    common: 'Common',
    nav: 'Navigation',
    today: 'Today',
    plan: 'Plan',
    staples: 'Staples',
    foundation: 'Foundation Day',
    swap: 'Swap',
    complete: 'Complete',
    settings: 'Settings',
    header: 'Header',
    auth: 'Auth',
    onboarding: 'Onboarding',
    privacy: 'Privacy',
    explore: 'Explore',
    purchase: 'Purchase',
};

export default function Translations({ translations }: Props) {
    const [search, setSearch] = useState('');
    const [openNs, setOpenNs] = useState<string | null>('auth');
    const [expandedKey, setExpandedKey] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'en' | 'ro'>('en');
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [translating, setTranslating] = useState<string | null>(null);
    const [saved, setSaved] = useState<Set<string>>(new Set());

    const groups = useMemo(() => {
        const enMap = new Map(translations.filter(t => t.locale === 'en').map(t => [t.key, t]));
        const roMap = new Map(translations.filter(t => t.locale === 'ro').map(t => [t.key, t]));
        const allKeys = [...new Set(translations.map(t => t.key))].sort();

        const map = new Map<string, GroupRow[]>();
        for (const key of allKeys) {
            const ns = key.split('.')[0];
            if (!map.has(ns)) map.set(ns, []);
            const en = enMap.get(key);
            const ro = roMap.get(key);
            map.get(ns)!.push({
                key,
                enId: en?.id ?? null,
                roId: ro?.id ?? null,
                enValue: en?.value ?? '',
                roValue: ro?.value ?? '',
            });
        }
        return map;
    }, [translations]);

    const filteredGroups = useMemo(() => {
        if (!search.trim()) return groups;
        const q = search.toLowerCase();
        const result = new Map<string, GroupRow[]>();
        groups.forEach((rows, ns) => {
            const filtered = rows.filter(
                r => r.key.toLowerCase().includes(q) ||
                     r.enValue.toLowerCase().includes(q) ||
                     r.roValue.toLowerCase().includes(q)
            );
            if (filtered.length > 0) result.set(ns, filtered);
        });
        return result;
    }, [groups, search]);

    const draftKey = (locale: string, key: string) => `${locale}:${key}`;

    const getDraft = (locale: string, key: string, fallback: string) =>
        drafts[draftKey(locale, key)] ?? fallback;

    const setDraft = (locale: string, key: string, value: string) =>
        setDrafts(d => ({ ...d, [draftKey(locale, key)]: value }));

    const handleSave = useCallback(async (row: GroupRow, locale: 'en' | 'ro') => {
        const id = locale === 'en' ? row.enId : row.roId;
        if (!id) return;
        const value = getDraft(locale, row.key, locale === 'en' ? row.enValue : row.roValue);
        const saveId = `${locale}:${row.key}`;
        setSaving(saveId);
        try {
            const res = await fetch(route('admin.ui-translations.update', id), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ value }),
            });
            if (res.ok) {
                setSaved(s => new Set([...s, saveId]));
                setTimeout(() => setSaved(s => { const n = new Set(s); n.delete(saveId); return n; }), 2000);
            }
        } finally {
            setSaving(null);
        }
    }, [drafts]);

    const handleAiTranslate = useCallback(async (row: GroupRow) => {
        const tKey = row.key;
        const enValue = getDraft('en', row.key, row.enValue);
        if (!enValue) return;
        setTranslating(tKey);
        try {
            const res = await fetch(route('admin.translate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ type: 'field', payload: { text: enValue } }),
            });
            if (res.ok) {
                const data = await res.json();
                const translated = data?.translation?.text;
                if (typeof translated === 'string') {
                    setDraft('ro', row.key, translated);
                    setActiveTab('ro');
                }
            }
        } finally {
            setTranslating(null);
        }
    }, [drafts]);

    const toggleNs = (ns: string) => {
        setOpenNs(o => o === ns ? null : ns);
        setExpandedKey(null);
    };

    const toggleRow = (key: string) => {
        setExpandedKey(k => k === key ? null : key);
        setActiveTab('en');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">UI Translations</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {translations.length / 2} keys · EN source of truth · RO editable with AI
                    </p>
                </div>
                <input
                    type="search"
                    placeholder="Search keys or text…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setOpenNs(null); }}
                    className="w-64 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
            </div>

            {/* Namespace groups */}
            <div className="space-y-2">
                {[...filteredGroups.entries()].map(([ns, rows]) => (
                    <div key={ns} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        {/* Namespace header */}
                        <button
                            onClick={() => toggleNs(ns)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900">
                                    {NAMESPACE_LABELS[ns] ?? ns}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">{ns}.*</span>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                    {rows.length}
                                </span>
                            </div>
                            <span className={cn(
                                'text-gray-400 text-xs transition-transform duration-200',
                                openNs === ns ? 'rotate-180' : ''
                            )}>▼</span>
                        </button>

                        {/* Rows */}
                        {openNs === ns && (
                            <div className="border-t border-gray-100">
                                {rows.map((row, i) => {
                                    const isExpanded = expandedKey === row.key;
                                    const enDraft = getDraft('en', row.key, row.enValue);
                                    const roDraft = getDraft('ro', row.key, row.roValue);
                                    const savingEn = saving === `en:${row.key}`;
                                    const savingRo = saving === `ro:${row.key}`;
                                    const savedEn = saved.has(`en:${row.key}`);
                                    const savedRo = saved.has(`ro:${row.key}`);
                                    const isTranslating = translating === row.key;

                                    return (
                                        <div
                                            key={row.key}
                                            className={cn(i > 0 && 'border-t border-gray-50')}
                                        >
                                            {/* Key row */}
                                            <button
                                                onClick={() => toggleRow(row.key)}
                                                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <span className="text-xs font-mono text-brand-600 shrink-0 mt-0.5 min-w-0 truncate max-w-[180px]">
                                                    {row.key.replace(`${ns}.`, '')}
                                                </span>
                                                <span className="text-sm text-gray-500 truncate flex-1 min-w-0">
                                                    {row.enValue}
                                                </span>
                                                <span className={cn(
                                                    'text-gray-300 text-xs shrink-0 transition-transform duration-150',
                                                    isExpanded ? 'rotate-180' : ''
                                                )}>▼</span>
                                            </button>

                                            {/* Inline editor */}
                                            {isExpanded && (
                                                <div className="mx-4 mb-3 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                                    {/* Tabs */}
                                                    <div className="flex border-b border-gray-200">
                                                        {(['en', 'ro'] as const).map(loc => (
                                                            <button
                                                                key={loc}
                                                                onClick={() => setActiveTab(loc)}
                                                                className={cn(
                                                                    'px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                                                                    activeTab === loc
                                                                        ? 'bg-white text-brand-700 border-b-2 border-brand-500'
                                                                        : 'text-gray-400 hover:text-gray-600'
                                                                )}
                                                            >
                                                                {loc === 'en' ? '🇬🇧 English' : '🇷🇴 Română'}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Editor body */}
                                                    <div className="p-3">
                                                        {activeTab === 'en' ? (
                                                            <>
                                                                <textarea
                                                                    value={enDraft}
                                                                    onChange={e => setDraft('en', row.key, e.target.value)}
                                                                    rows={enDraft.length > 80 ? 3 : 2}
                                                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white resize-none"
                                                                />
                                                                <div className="flex justify-end mt-2">
                                                                    <button
                                                                        onClick={() => handleSave(row, 'en')}
                                                                        disabled={savingEn || enDraft === row.enValue}
                                                                        className={cn(
                                                                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                                                            savedEn
                                                                                ? 'bg-green-100 text-green-700'
                                                                                : 'bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40'
                                                                        )}
                                                                    >
                                                                        {savedEn ? '✓ Saved' : savingEn ? 'Saving…' : 'Save EN'}
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <textarea
                                                                    value={roDraft}
                                                                    onChange={e => setDraft('ro', row.key, e.target.value)}
                                                                    rows={roDraft.length > 80 ? 3 : 2}
                                                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white resize-none"
                                                                />
                                                                <div className="flex items-center justify-between mt-2 gap-2">
                                                                    <button
                                                                        onClick={() => handleAiTranslate(row)}
                                                                        disabled={isTranslating || !row.enId}
                                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-40 transition-colors"
                                                                    >
                                                                        {isTranslating ? '✨ Translating…' : '✨ Translate with AI'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleSave(row, 'ro')}
                                                                        disabled={savingRo || roDraft === row.roValue}
                                                                        className={cn(
                                                                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                                                            savedRo
                                                                                ? 'bg-green-100 text-green-700'
                                                                                : 'bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40'
                                                                        )}
                                                                    >
                                                                        {savedRo ? '✓ Saved' : savingRo ? 'Saving…' : 'Save RO'}
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}

                {filteredGroups.size === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">
                        No keys found for "{search}"
                    </div>
                )}
            </div>
        </div>
    );
}

Translations.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
