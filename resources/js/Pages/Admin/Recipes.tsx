import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { Nutrition } from '@/types/app';

interface RecipeRow {
    id: string;
    name: string;
    nutrition: Nutrition;
    tags: string[];
    isActive: boolean;
    sortOrder: number;
    module: { name: string; slug: string } | null;
}

interface Props { recipes: RecipeRow[]; }

export default function AdminRecipes({ recipes }: Props) {
    const toggle = (id: string) => router.patch(route('admin.recipes.toggle', { id }));

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Recipes</h1>
                    <p className="text-sm text-gray-400">{recipes.length} recipes</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-xs text-gray-500">
                            <th className="text-left px-5 py-3 font-medium">#</th>
                            <th className="text-left px-5 py-3 font-medium">Recipe</th>
                            <th className="text-left px-5 py-3 font-medium">Nutrition</th>
                            <th className="text-left px-5 py-3 font-medium">Module</th>
                            <th className="text-left px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {recipes.map((r) => (
                            <tr key={r.id}>
                                <td className="px-5 py-3 text-gray-400 font-mono text-xs">{r.sortOrder}</td>
                                <td className="px-5 py-3">
                                    <p className="font-medium text-gray-900">{r.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{r.tags.join(', ')}</p>
                                </td>
                                <td className="px-5 py-3 text-xs text-gray-500">
                                    {r.nutrition.calories} kcal · {r.nutrition.protein}g P · {r.nutrition.carbs}g C · {r.nutrition.fat}g F
                                </td>
                                <td className="px-5 py-3">
                                    {r.module ? (
                                        <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                                            {r.module.name}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                                        r.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {r.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <button onClick={() => toggle(r.id)}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                        {r.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

AdminRecipes.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
