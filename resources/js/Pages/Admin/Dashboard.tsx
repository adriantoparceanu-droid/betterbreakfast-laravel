import AdminLayout from '@/Layouts/AdminLayout';

interface RecentEvent {
    id: number;
    event: string;
    anonymousId: string;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    usersWithAccess: number;
    completions: number;
    swaps: number;
}

interface Props {
    stats: Stats;
    recentEvents: RecentEvent[];
}

export default function AdminDashboard({ stats, recentEvents }: Props) {
    const cards = [
        { label: 'Total users',        value: stats.totalUsers,      sub: 'registered accounts' },
        { label: 'Active subscribers', value: stats.usersWithAccess, sub: 'with plan access' },
        { label: 'Days completed',     value: stats.completions,     sub: 'COMPLETE_DAY events' },
        { label: 'Recipe swaps',       value: stats.swaps,           sub: 'SWAP_RECIPE events' },
    ];

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-sm text-gray-400 mb-8">Better Breakfast overview</p>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
                {cards.map(({ label, value, sub }) => (
                    <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5">
                        <p className="text-3xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent events</h2>
                {recentEvents.length === 0 ? (
                    <p className="text-sm text-gray-400">No events yet.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-100">
                                <th className="text-left pb-2 font-medium">Event</th>
                                <th className="text-left pb-2 font-medium">Anonymous ID</th>
                                <th className="text-left pb-2 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentEvents.map((e) => (
                                <tr key={e.id}>
                                    <td className="py-2">
                                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                                            e.event === 'COMPLETE_DAY'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {e.event}
                                        </span>
                                    </td>
                                    <td className="py-2 text-gray-400 font-mono text-xs">{e.anonymousId.slice(0, 12)}…</td>
                                    <td className="py-2 text-gray-400 text-xs">
                                        {new Date(e.createdAt).toLocaleDateString('en-GB', {
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

AdminDashboard.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
