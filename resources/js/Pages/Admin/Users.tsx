import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface UserRow {
    id: number;
    username: string;
    email: string;
    hasAccess: boolean;
    createdAt: string;
}

interface Props { users: UserRow[]; }

export default function AdminUsers({ users }: Props) {
    const grant   = (id: number) => router.post(route('admin.users.grant',   { userId: id }));
    const revoke  = (id: number) => router.delete(route('admin.users.revoke', { userId: id }));
    const destroy = (id: number) => {
        if (confirm('Delete this user permanently?')) {
            router.delete(route('admin.users.destroy', { userId: id }));
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Users</h1>
            <p className="text-sm text-gray-400 mb-8">{users.length} registered accounts</p>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-xs text-gray-500">
                            <th className="text-left px-5 py-3 font-medium">User</th>
                            <th className="text-left px-5 py-3 font-medium">Access</th>
                            <th className="text-left px-5 py-3 font-medium">Joined</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-8 text-center text-gray-400">No users yet.</td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-5 py-3">
                                        <p className="font-medium text-gray-900">{u.username}</p>
                                        <p className="text-xs text-gray-400">{u.email}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                                            u.hasAccess ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {u.hasAccess ? 'Active' : 'No access'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-400 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString('en-GB', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2 justify-end">
                                            {u.hasAccess ? (
                                                <button onClick={() => revoke(u.id)}
                                                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                                    Revoke
                                                </button>
                                            ) : (
                                                <button onClick={() => grant(u.id)}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors">
                                                    Grant access
                                                </button>
                                            )}
                                            <button onClick={() => destroy(u.id)}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                                                Delete
                                            </button>
                                        </div>
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

AdminUsers.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
