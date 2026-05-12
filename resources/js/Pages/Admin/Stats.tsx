import AdminLayout from '@/Layouts/AdminLayout';

interface RecipeCount { id: string; name: string; count: number; }

interface Props {
    completionsByDay: Record<number, number>;
    topCompleted: RecipeCount[];
    topSwappedTo: RecipeCount[];
    topSwappedFrom: RecipeCount[];
    totalCompletions: number;
    totalSwaps: number;
}

export default function AdminStats({
    completionsByDay, topCompleted, topSwappedTo, topSwappedFrom, totalCompletions, totalSwaps,
}: Props) {
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Stats</h1>
                <p className="text-sm text-gray-400">{totalCompletions} completions · {totalSwaps} swaps</p>
            </div>

            <Section title="Completions by day number" sub="How many users completed each day">
                <div className="grid grid-cols-10 gap-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((day) => {
                        const count = completionsByDay[day] ?? 0;
                        const max = Math.max(...Object.values(completionsByDay), 1);
                        return (
                            <div key={day} className="text-center">
                                <div className="flex flex-col items-center justify-end h-20 mb-1">
                                    <div
                                        className="w-full rounded-lg bg-brand-400"
                                        style={{ height: `${Math.max(4, (count / max) * 72)}px` }}
                                    />
                                </div>
                                <p className="text-xs font-medium text-gray-700">{count}</p>
                                <p className="text-xs text-gray-400">D{day}</p>
                            </div>
                        );
                    })}
                </div>
            </Section>

            <div className="grid grid-cols-3 gap-6">
                <Section title="Most completed" sub="Recipes users stuck with">
                    <RecipeTable rows={topCompleted} label="completions" />
                </Section>
                <Section title="Most chosen in swap" sub="Recipes users swapped to">
                    <RecipeTable rows={topSwappedTo} label="picks" />
                </Section>
                <Section title="Most replaced" sub="Recipes users swapped away from">
                    <RecipeTable rows={topSwappedFrom} label="replacements" />
                </Section>
            </div>
        </div>
    );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700">{title}</p>
            <p className="text-xs text-gray-400 mb-4">{sub}</p>
            {children}
        </div>
    );
}

function RecipeTable({ rows, label }: { rows: RecipeCount[]; label: string }) {
    if (rows.length === 0) return <p className="text-xs text-gray-400">No data yet.</p>;
    return (
        <div className="space-y-2">
            {rows.map(({ id, name, count }) => (
                <div key={id} className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-700 truncate flex-1">{name}</p>
                    <span className="text-xs font-semibold text-gray-500 shrink-0">{count} {label}</span>
                </div>
            ))}
        </div>
    );
}

AdminStats.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
