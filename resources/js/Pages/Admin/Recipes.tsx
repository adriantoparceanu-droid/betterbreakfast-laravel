import { useState } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import type { Nutrition, Ingredient, IngredientCategory } from '@/types/app';

const CATEGORIES: IngredientCategory[] = [
    'Proteins', 'Grains', 'Dairy', 'Fruits',
    'Vegetables', 'Seeds & Nuts', 'Condiments',
];

const SELECT_CLS = 'h-9 rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500';
const INLINE_INPUT_CLS = 'h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500';

interface RecipeRow {
    id: string;
    name: string;
    image: string;
    baseServings: number;
    ingredients: Ingredient[];
    steps: string[];
    nutrition: Nutrition;
    tags: string[];
    isActive: boolean;
    sortOrder: number;
    module: { id: string; name: string; slug: string } | null;
}

interface ModuleOption { id: string; name: string; }

interface Props { recipes: RecipeRow[]; modules: ModuleOption[]; }

// ─── Form types ───────────────────────────────────────────────────────────────

type FormValues = {
    name: string;
    image: string;
    base_servings: number;
    sort_order: number;
    module_id: string;
    is_active: boolean;
    tags: string;
    nutrition: Nutrition;
    ingredients: Ingredient[];
    steps: { value: string }[];
};

function toDefaults(recipe: RecipeRow | null): FormValues {
    if (recipe) {
        return {
            name: recipe.name,
            image: recipe.image,
            base_servings: recipe.baseServings,
            sort_order: recipe.sortOrder,
            module_id: recipe.module?.id ?? '',
            is_active: recipe.isActive,
            tags: recipe.tags.join(', '),
            nutrition: recipe.nutrition,
            ingredients: recipe.ingredients,
            steps: recipe.steps.map(v => ({ value: v })),
        };
    }
    return {
        name: '',
        image: '',
        base_servings: 1,
        sort_order: 10,
        module_id: '',
        is_active: true,
        tags: '',
        nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
        ingredients: [{ name: '', quantity: 1, unit: 'g', category: 'Proteins' }],
        steps: [{ value: '' }],
    };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function RecipeModal({
    recipe,
    modules,
    onClose,
}: {
    recipe: RecipeRow | null;
    modules: ModuleOption[];
    onClose: () => void;
}) {
    const { register, handleSubmit, control, formState: { isSubmitting, errors } } =
        useForm<FormValues>({ defaultValues: toDefaults(recipe) });

    const { fields: ingFields, append: addIng, remove: removeIng } =
        useFieldArray({ control, name: 'ingredients' });

    const { fields: stepFields, append: addStep, remove: removeStep } =
        useFieldArray({ control, name: 'steps' });

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        const payload = {
            ...data,
            tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
            steps: data.steps.map(s => s.value),
            module_id: data.module_id || null,
            base_servings: Number(data.base_servings),
            sort_order: Number(data.sort_order),
            nutrition: {
                calories: Number(data.nutrition.calories),
                protein:  Number(data.nutrition.protein),
                fat:      Number(data.nutrition.fat),
                carbs:    Number(data.nutrition.carbs),
                fiber:    Number(data.nutrition.fiber),
            },
            ingredients: data.ingredients.map(ing => ({
                ...ing,
                quantity: Number(ing.quantity),
            })),
        };

        if (recipe) {
            router.put(route('admin.recipes.update', { id: recipe.id }), payload, {
                onSuccess: onClose,
            });
        } else {
            router.post(route('admin.recipes.store'), payload, {
                onSuccess: onClose,
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/40">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-8">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">
                        {recipe ? 'Edit Recipe' : 'Add Recipe'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-2xl leading-none text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="px-6 py-5 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">

                        {/* Basic */}
                        <section>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Basic</p>
                            <div className="flex flex-col gap-3">
                                <Input
                                    label="Name"
                                    placeholder="e.g. Greek Yogurt Bowl"
                                    error={errors.name ? 'Required' : undefined}
                                    {...register('name', { required: true })}
                                />
                                <Input label="Image URL" placeholder="https://..." {...register('image')} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Base Servings" type="number" min="1" {...register('base_servings', { required: true, min: 1 })} />
                                    <Input label="Sort Order" type="number" min="0" {...register('sort_order')} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Module</label>
                                    <select
                                        {...register('module_id')}
                                        className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">— No module —</option>
                                        {modules.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Tags"
                                    placeholder="quick, high-protein, vegan"
                                    hint="Comma-separated"
                                    {...register('tags')}
                                />
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" {...register('is_active')} className="w-4 h-4 rounded accent-brand-600" />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>
                            </div>
                        </section>

                        {/* Nutrition */}
                        <section>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Nutrition (per serving)</p>
                            <div className="grid grid-cols-5 gap-2">
                                {(['calories', 'protein', 'fat', 'carbs', 'fiber'] as const).map(key => (
                                    <div key={key} className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-gray-600 capitalize">{key}</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            {...register(`nutrition.${key}`, { required: true })}
                                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-1 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Ingredients */}
                        <section>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Ingredients
                            </p>
                            <div className="flex flex-col gap-2">
                                {ingFields.map((field, idx) => (
                                    <div key={field.id} className="flex gap-2 items-center">
                                        <input
                                            placeholder="Name"
                                            {...register(`ingredients.${idx}.name`, { required: true })}
                                            className={`flex-1 ${INLINE_INPUT_CLS}`}
                                        />
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            placeholder="Qty"
                                            {...register(`ingredients.${idx}.quantity`, { required: true })}
                                            className={`w-16 text-center ${INLINE_INPUT_CLS}`}
                                        />
                                        <input
                                            placeholder="Unit"
                                            {...register(`ingredients.${idx}.unit`, { required: true })}
                                            className={`w-16 ${INLINE_INPUT_CLS}`}
                                        />
                                        <select
                                            {...register(`ingredients.${idx}.category`)}
                                            className={SELECT_CLS}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => removeIng(idx)}
                                            className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xl leading-none"
                                        >×</button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addIng({ name: '', quantity: 1, unit: 'g', category: 'Proteins' })}
                                    className="text-sm text-brand-600 hover:text-brand-700 font-medium text-left mt-1"
                                >
                                    + Add ingredient
                                </button>
                            </div>
                        </section>

                        {/* Steps */}
                        <section>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Steps</p>
                            <div className="flex flex-col gap-2">
                                {stepFields.map((field, idx) => (
                                    <div key={field.id} className="flex gap-2 items-start">
                                        <span className="text-xs text-gray-400 pt-2.5 w-5 shrink-0 text-right">{idx + 1}.</span>
                                        <textarea
                                            {...register(`steps.${idx}.value`, { required: true })}
                                            placeholder={`Step ${idx + 1}…`}
                                            rows={2}
                                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeStep(idx)}
                                            className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xl leading-none mt-0.5"
                                        >×</button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addStep({ value: '' })}
                                    className="text-sm text-brand-600 hover:text-brand-700 font-medium text-left mt-1"
                                >
                                    + Add step
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" loading={isSubmitting}>
                            {recipe ? 'Save changes' : 'Add Recipe'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRecipes({ recipes, modules }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<RecipeRow | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const openAdd  = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (r: RecipeRow) => { setEditing(r); setModalOpen(true); };
    const closeModal = () => setModalOpen(false);

    const toggle  = (id: string) => router.patch(route('admin.recipes.toggle', { id }));
    const destroy = (id: string) => router.delete(route('admin.recipes.destroy', { id }), {
        onSuccess: () => setConfirmDelete(null),
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Recipes</h1>
                    <p className="text-sm text-gray-400">{recipes.length} recipes</p>
                </div>
                <Button size="sm" onClick={openAdd}>+ Add Recipe</Button>
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
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
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
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => toggle(r.id)}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            {r.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => openEdit(r)}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        {confirmDelete === r.id ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-xs text-gray-500">Sure?</span>
                                                <button
                                                    onClick={() => destroy(r.id)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                >Yes</button>
                                                <button
                                                    onClick={() => setConfirmDelete(null)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                                >No</button>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDelete(r.id)}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <RecipeModal recipe={editing} modules={modules} onClose={closeModal} />
            )}
        </div>
    );
}

AdminRecipes.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
