import { Fragment, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface UserRow {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'user';
    hasAccess: boolean;
    unlockedCategoryIds: string[];
    createdAt: string;
}

interface CategoryOption {
    id: string;
    name: string;
    price: number;
}

interface Props { users: UserRow[]; premiumCategories: CategoryOption[]; }

export default function AdminUsers({ users, premiumCategories }: Props) {
    const { auth } = usePage<PageProps>().props;
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [expandedUser, setExpandedUser] = useState<number | null>(null);

    const grant       = (id: number) => router.post(route('admin.users.grant',   { userId: id }));
    const revoke      = (id: number) => router.delete(route('admin.users.revoke', { userId: id }));
    const toggleRole  = (id: number) => router.patch(route('admin.users.role',   { userId: id }));
    const destroy     = (id: number) => router.delete(route('admin.users.destroy', { userId: id }), {
        onSuccess: () => setConfirmDelete(null),
    });

    const grantCategory  = (userId: number, catId: string) =>
        router.post(route('admin.users.categories.grant', { userId, categoryId: catId }));
    const revokeCategory = (userId: number, catId: string) =>
        router.delete(route('admin.users.categories.revoke', { userId, categoryId: catId }));

    const admins = users.filter(u => u.role === 'admin');
    const regular = users.filter(u => u.role === 'user');

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Users</h1>
            <p className="text-sm text-gray-400 mb-8">
                {users.length} total · {admins.length} admin{admins.length !== 1 ? 's' : ''} · {regular.length} user{regular.length !== 1 ? 's' : ''}
            </p>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-xs text-gray-500">
                            <th className="text-left px-5 py-3 font-medium">User</th>
                            <th className="text-left px-5 py-3 font-medium">Role</th>
                            <th className="text-left px-5 py-3 font-medium">Plan 1</th>
                            <th className="text-left px-5 py-3 font-medium">Premium</th>
                            <th className="text-left px-5 py-3 font-medium">Joined</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No users yet.</td>
                            </tr>
                        ) : (
                            users.map((u) => {
                                const isSelf = u.id === auth.user.id;
                                return (
                                    <Fragment key={u.id}>
                                    <tr className={`hover:bg-gray-50 transition-colors ${u.role === 'admin' ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-gray-900">
                                                {u.username}
                                                {isSelf && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                                            </p>
                                            <p className="text-xs text-gray-400">{u.email}</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                                                u.role === 'admin'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                                                u.hasAccess ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {u.hasAccess ? 'Active' : 'No access'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {premiumCategories.length === 0 ? (
                                                <span className="text-xs text-gray-300">—</span>
                                            ) : (
                                                <button
                                                    onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                                >
                                                    {u.unlockedCategoryIds.length}/{premiumCategories.length} unlocked
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-gray-400 text-xs">
                                            {new Date(u.createdAt).toLocaleDateString('en-GB', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2 justify-end">
                                                {/* Access */}
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

                                                {/* Role toggle */}
                                                {!isSelf && (
                                                    <button onClick={() => toggleRole(u.id)}
                                                        className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
                                                        {u.role === 'admin' ? 'Make user' : 'Make admin'}
                                                    </button>
                                                )}

                                                {/* Delete */}
                                                {!isSelf && (
                                                    confirmDelete === u.id ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="text-xs text-gray-500">Sure?</span>
                                                            <button onClick={() => destroy(u.id)}
                                                                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                                                                Yes
                                                            </button>
                                                            <button onClick={() => setConfirmDelete(null)}
                                                                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                                                No
                                                            </button>
                                                        </span>
                                                    ) : (
                                                        <button onClick={() => setConfirmDelete(u.id)}
                                                            className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                                                            Delete
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Expandable category access row */}
                                    {expandedUser === u.id && premiumCategories.length > 0 && (
                                        <tr className="bg-purple-50/40">
                                            <td colSpan={6} className="px-5 py-3">
                                                <p className="text-xs font-semibold text-gray-500 mb-2">Premium Categories — {u.username}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {premiumCategories.map(cat => {
                                                        const has = u.unlockedCategoryIds.includes(cat.id);
                                                        return (
                                                            <div key={cat.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5">
                                                                <span className="text-xs text-gray-700 font-medium">{cat.name}</span>
                                                                <span className="text-xs text-gray-400">€{cat.price.toFixed(2)}</span>
                                                                {has ? (
                                                                    <button onClick={() => revokeCategory(u.id, cat.id)}
                                                                        className="text-xs px-2 py-0.5 rounded-lg bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                                                                        Revoke
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => grantCategory(u.id, cat.id)}
                                                                        className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                                                                        Grant
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

AdminUsers.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
