import { useState, useRef } from 'react';
import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { router } from '@inertiajs/react';
import {
    DndContext, closestCenter,
    KeyboardSensor, PointerSensor,
    useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext, sortableKeyboardCoordinates,
    useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import RichTextEditor from '@/Components/ui/RichTextEditor';
import { cn } from '@/lib/utils';
import { translateContent } from '@/lib/translate';
import {
    METRIC_UNITS, IMPERIAL_UNITS, UNIVERSAL_UNITS,
    convertForForm,
    type UnitSystem,
} from '@/data/units';
import type { Nutrition, Ingredient, IngredientCategory } from '@/types/app';

const CATEGORIES: IngredientCategory[] = [
    'Proteins', 'Grains & Legumes', 'Dairy', 'Fruits',
    'Vegetables', 'Fats, Nuts & Seeds', 'Condiments',
];

const SELECT_CLS = 'h-9 rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500';
const INLINE_INPUT_CLS = 'h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500';
const ING_GRID = 'grid grid-cols-[1.25rem_1fr_5rem_5rem_9rem_2.25rem] gap-2 items-center';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecipeData {
    id: string;
    name: string;
    image: string;
    baseServings: number;
    ingredients: Ingredient[];
    steps: string[];
    substitutions: string;
    whyThisWorks: string;
    nutrition: Nutrition;
    tags: string[];
    isActive: boolean;
    sortOrder: number;
    module: { id: string; name: string; slug: string } | null;
    category: { id: string; name: string } | null;
    translations?: { ro?: RecipeTranslationRo } | null;
}

interface RecipeTranslationRo {
    name?: string;
    steps?: string[];
    ingredients?: { name: string }[];
    substitutions?: string;
    whyThisWorks?: string;
}

interface ModuleOption    { id: string; name: string; }
interface CategoryOption  { id: string; name: string; module_id: string; }
interface MasterIngredient {
    name: string;
    category: string;
    caloriesPer100g: number | null;
    proteinPer100g:  number | null;
    fatPer100g:      number | null;
    carbsPer100g:    number | null;
    fiberPer100g:    number | null;
}

interface Props {
    recipe: RecipeData | null;
    modules: ModuleOption[];
    categories: CategoryOption[];
    masterIngredients: MasterIngredient[];
}

type FormValues = {
    name: string;
    image: string;
    base_servings: number;
    sort_order: number;
    module_id: string;
    category_id: string;
    is_active: boolean;
    tags: string;
    nutrition: Nutrition;
    ingredients: Ingredient[];
    steps: { value: string }[];
    substitutions: string;
    why_this_works: string;
    tr_name: string;
    tr_substitutions: string;
    tr_why: string;
    tr_steps: { value: string }[];
    tr_ingredients: { name: string }[];
};

function toDefaults(recipe: RecipeData | null): FormValues {
    if (recipe) {
        return {
            name:           recipe.name,
            image:          recipe.image,
            base_servings:  recipe.baseServings,
            sort_order:     recipe.sortOrder,
            module_id:      recipe.module?.id ?? '',
            category_id:    recipe.category?.id ?? '',
            is_active:      recipe.isActive,
            tags:           recipe.tags.join(', '),
            nutrition:      recipe.nutrition,
            ingredients:    recipe.ingredients,
            steps:          recipe.steps.map(v => ({ value: v })),
            substitutions:  recipe.substitutions,
            why_this_works: recipe.whyThisWorks,
            tr_name:         recipe.translations?.ro?.name ?? '',
            tr_substitutions:recipe.translations?.ro?.substitutions ?? '',
            tr_why:          recipe.translations?.ro?.whyThisWorks ?? '',
            tr_steps:        (recipe.translations?.ro?.steps ?? []).map(v => ({ value: v })),
            tr_ingredients:  (recipe.translations?.ro?.ingredients ?? []).map(i => ({ name: i.name })),
        };
    }
    return {
        name:           '',
        image:          '',
        base_servings:  1,
        sort_order:     10,
        module_id:      '',
        category_id:    '',
        is_active:      true,
        tags:           '',
        nutrition:      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
        ingredients:    [{ name: '', quantity: 1, unit: 'g', category: 'Proteins' }],
        steps:          [{ value: '' }],
        substitutions:  '',
        why_this_works: '',
        tr_name:         '',
        tr_substitutions:'',
        tr_why:          '',
        tr_steps:        [],
        tr_ingredients:  [],
    };
}

// ─── Sortable rows ────────────────────────────────────────────────────────────

interface SortableRowProps { id: string; children: React.ReactNode; }

function SortableStepRow({ id, children }: SortableRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`flex gap-2 items-start${isDragging ? ' opacity-50' : ''}`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                tabIndex={-1}
                className="h-9 w-5 flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
            >
                <GripVertical size={14} />
            </button>
            {children}
        </div>
    );
}

function SortableIngredientRow({ id, children }: SortableRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`${ING_GRID}${isDragging ? ' opacity-50' : ''}`}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                tabIndex={-1}
                className="h-9 w-5 flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
            >
                <GripVertical size={14} />
            </button>
            {children}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecipeForm({ recipe, modules, categories, masterIngredients }: Props) {
    const isEdit = recipe !== null;
    const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
    const [uploading, setUploading] = useState(false);
    const [aiCalculating, setAiCalculating] = useState(false);
    const [aiBreakdown, setAiBreakdown] = useState<{
        name: string; original: string; grams: number;
        calories: number; protein: number; fat: number; carbs: number; fiber: number;
    }[] | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [lang, setLang] = useState<'en' | 'ro'>('en');
    const [trBusy, setTrBusy] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Laravel sets XSRF-TOKEN cookie (URL-encoded); read it for fetch CSRF auth
        const xsrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '';
        const csrf = decodeURIComponent(xsrf);

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const res = await fetch(route('admin.recipes.upload-image'), {
                method:  'POST',
                headers: {
                    'X-XSRF-TOKEN':     csrf,
                    'Accept':           'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });
            const json = await res.json() as { url?: string; message?: string; errors?: Record<string, string[]> };
            if (res.ok && json.url) {
                setValue('image', json.url);
            } else {
                const msg = json.errors
                    ? Object.values(json.errors).flat().join(' ')
                    : (json.message ?? 'Upload failed');
                alert(msg);
            }
        } catch {
            alert('Upload failed — check console for details');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const {
        register, handleSubmit, control, watch, setValue,
        formState: { isSubmitting, errors },
    } = useForm<FormValues>({ defaultValues: toDefaults(recipe) });

    const selectedModuleId   = watch('module_id');
    const filteredCategories = categories.filter(c => c.module_id === selectedModuleId);

    const { fields: ingFields, append: addIng, remove: removeIng, move: moveIng } =
        useFieldArray({ control, name: 'ingredients' });
    const { fields: stepFields, append: addStep, remove: removeStep, move: moveStep } =
        useFieldArray({ control, name: 'steps' });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // ─── DnD reorder ─────────────────────────────────────────────────────────

    function handleIngredientDragEnd({ active, over }: DragEndEvent) {
        if (!over || active.id === over.id) return;
        const from = ingFields.findIndex(f => f.id === active.id);
        const to   = ingFields.findIndex(f => f.id === over.id);
        if (from !== -1 && to !== -1) moveIng(from, to);
    }

    function handleStepDragEnd({ active, over }: DragEndEvent) {
        if (!over || active.id === over.id) return;
        const from = stepFields.findIndex(f => f.id === active.id);
        const to   = stepFields.findIndex(f => f.id === over.id);
        if (from !== -1 && to !== -1) moveStep(from, to);
    }

    // ─── Calculate nutrition via Gemini AI ────────────────────────────────────

    async function calculateWithAI() {
        const ingredients  = watch('ingredients').filter(i => i.name.trim());
        const baseServings = Number(watch('base_servings')) || 1;

        if (ingredients.length === 0) return;

        const xsrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '';
        const csrf = decodeURIComponent(xsrf);

        setAiCalculating(true);
        setAiError(null);
        setAiBreakdown(null);

        try {
            const res = await fetch(route('admin.recipes.calculate-nutrition'), {
                method:  'POST',
                headers: {
                    'Content-Type':     'application/json',
                    'Accept':           'application/json',
                    'X-XSRF-TOKEN':     csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ ingredients, base_servings: baseServings }),
            });

            const json = await res.json() as {
                per_serving?: { calories: number; protein: number; fat: number; carbs: number; fiber: number };
                ingredients_detail?: typeof aiBreakdown;
                error?: string;
            };

            if (!res.ok || !json.per_serving) {
                setAiError(json.error ?? 'Calculation failed.');
                return;
            }

            setValue('nutrition.calories', json.per_serving.calories);
            setValue('nutrition.protein',  json.per_serving.protein);
            setValue('nutrition.fat',      json.per_serving.fat);
            setValue('nutrition.carbs',    json.per_serving.carbs);
            setValue('nutrition.fiber',    json.per_serving.fiber);
            setAiBreakdown(json.ingredients_detail ?? null);
        } catch {
            setAiError('Network error — could not reach the server.');
        } finally {
            setAiCalculating(false);
        }
    }

    // ─── Unit system toggle ───────────────────────────────────────────────────

    function switchUnitSystem(next: UnitSystem) {
        if (next === unitSystem) return;
        const current = watch('ingredients');
        current.forEach((ing, idx) => {
            const result = convertForForm(Number(ing.quantity), ing.unit, next);
            setValue(`ingredients.${idx}.quantity`, result.qty);
            setValue(`ingredients.${idx}.unit`, result.unit);
        });
        setUnitSystem(next);
    }

    // ─── Per-field RO translation via Gemini AI ───────────────────────────────

    async function trField(
        sourceText: string,
        target: `tr_name` | `tr_substitutions` | `tr_why` | `tr_ingredients.${number}.name` | `tr_steps.${number}.value`,
        busyKey: string,
    ) {
        if (!sourceText.trim()) return;
        setTrBusy(busyKey);
        const res = await translateContent<{ text?: string }>('field', { text: sourceText });
        setTrBusy(null);
        if (!res.ok) { alert(res.error); return; }
        setValue(target, res.translation.text ?? '');
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        const roSteps = data.tr_steps.map(s => s.value).filter(Boolean);
        const roIngs  = data.tr_ingredients.map(i => ({ name: i.name })).filter(i => i.name.trim());
        const ro: {
            name?: string;
            steps?: string[];
            ingredients?: { name: string }[];
            substitutions?: string;
            whyThisWorks?: string;
        } = {};
        if (data.tr_name.trim())          ro.name = data.tr_name.trim();
        if (roSteps.length)               ro.steps = roSteps;
        if (roIngs.length)                ro.ingredients = roIngs;
        if (data.tr_substitutions.trim()) ro.substitutions = data.tr_substitutions;
        if (data.tr_why.trim())           ro.whyThisWorks = data.tr_why;

        const payload = {
            ...data,
            tags:           data.tags.split(',').map(t => t.trim()).filter(Boolean),
            steps:          data.steps.map(s => s.value),
            module_id:      data.module_id || null,
            category_id:    data.category_id || null,
            base_servings:  Number(data.base_servings),
            sort_order:     Number(data.sort_order),
            substitutions:  data.substitutions || null,
            why_this_works: data.why_this_works || null,
            translations:   Object.keys(ro).length ? { ro } : null,
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

        if (isEdit) {
            router.put(route('admin.recipes.update', { id: recipe.id }), payload);
        } else {
            router.post(route('admin.recipes.store'), payload);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto p-8">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    type="button"
                    onClick={() => router.visit(route('admin.recipes'))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors text-lg"
                >←</button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEdit ? 'Edit Recipe' : 'Add Recipe'}
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {isEdit ? recipe.name : 'New recipe'}
                    </p>
                </div>
            </div>

            {/* Language tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
                {(['en', 'ro'] as const).map((l) => (
                    <button
                        key={l}
                        type="button"
                        onClick={() => setLang(l)}
                        className={cn(
                            'px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                            lang === l ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        {l === 'en' ? 'English' : 'Română'}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

                {/* ═══ EN tab — main recipe (source of truth) ═══════════════ */}
                <div className={cn('flex flex-col gap-8', lang === 'ro' && 'hidden')}>

                {/* ─── Basic ─────────────────────────────────────────────── */}
                <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Basic</p>
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Name"
                            placeholder="e.g. Greek Yogurt Bowl"
                            error={errors.name ? 'Required' : undefined}
                            {...register('name', { required: true })}
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Image</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://... or browse to upload"
                                    className="flex-1"
                                    {...register('image')}
                                />
                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="shrink-0 h-12 px-4 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                                >
                                    {uploading ? 'Uploading…' : 'Browse…'}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                            {watch('image') && (
                                <img
                                    src={watch('image')}
                                    alt="preview"
                                    className="mt-1 h-24 w-24 rounded-xl object-cover border border-gray-200"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Base Servings" type="number" min="1" {...register('base_servings', { required: true, min: 1 })} />
                            <Input label="Sort Order" type="number" min="0" {...register('sort_order')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Category</label>
                                <select
                                    {...register('category_id')}
                                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                                    disabled={filteredCategories.length === 0}
                                >
                                    <option value="">— No category —</option>
                                    {filteredCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {filteredCategories.length === 0 && selectedModuleId && (
                                    <p className="text-xs text-gray-400">No categories for this module yet.</p>
                                )}
                            </div>
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

                {/* ─── Ingredients ───────────────────────────────────────── */}
                <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ingredients</p>
                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                            {(['metric', 'imperial'] as UnitSystem[]).map(sys => (
                                <button
                                    key={sys}
                                    type="button"
                                    onClick={() => switchUnitSystem(sys)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                                        unitSystem === sys
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {sys === 'metric' ? 'Metric' : 'Imperial'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {/* Column headers */}
                        <div className={`${ING_GRID} px-1`}>
                            <span />
                            <span className="text-xs text-gray-400">Name</span>
                            <span className="text-xs text-gray-400">Qty</span>
                            <span className="text-xs text-gray-400">Unit</span>
                            <span className="text-xs text-gray-400">Category</span>
                            <span />
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleIngredientDragEnd}
                        >
                            <SortableContext
                                items={ingFields.map(f => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {ingFields.map((field, idx) => (
                                    <SortableIngredientRow key={field.id} id={field.id}>
                                        <input
                                            placeholder="Name"
                                            list="master-ingredients-list"
                                            {...register(`ingredients.${idx}.name`, {
                                                required: true,
                                                onChange: (e) => {
                                                    const match = masterIngredients.find(
                                                        m => m.name.toLowerCase() === e.target.value.toLowerCase()
                                                    );
                                                    if (match) {
                                                        setValue(`ingredients.${idx}.category`, match.category as IngredientCategory);
                                                    }
                                                },
                                            })}
                                            className={INLINE_INPUT_CLS}
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="Qty"
                                            {...register(`ingredients.${idx}.quantity`, { required: true })}
                                            className={`text-center ${INLINE_INPUT_CLS}`}
                                        />
                                        <select
                                            {...register(`ingredients.${idx}.unit`, { required: true })}
                                            className={SELECT_CLS}
                                        >
                                            <optgroup label="Metric">
                                                {METRIC_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </optgroup>
                                            <optgroup label="Imperial">
                                                {IMPERIAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </optgroup>
                                            <optgroup label="Universal">
                                                {UNIVERSAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </optgroup>
                                        </select>
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
                                    </SortableIngredientRow>
                                ))}
                            </SortableContext>
                        </DndContext>

                        <button
                            type="button"
                            onClick={() => addIng({ name: '', quantity: 1, unit: unitSystem === 'metric' ? 'g' : 'oz', category: 'Proteins' })}
                            className="text-sm text-brand-600 hover:text-brand-700 font-medium text-left mt-1"
                        >
                            + Add ingredient
                        </button>
                    </div>

                    <datalist id="master-ingredients-list">
                        {masterIngredients.map(m => (
                            <option key={m.name} value={m.name} />
                        ))}
                    </datalist>
                </section>

                {/* ─── Nutrition ─────────────────────────────────────────── */}
                <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nutrition (per serving)</p>
                        <button
                            type="button"
                            onClick={calculateWithAI}
                            disabled={aiCalculating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 disabled:opacity-60 disabled:cursor-wait transition-colors"
                        >
                            <span>{aiCalculating ? '⏳' : '✨'}</span>
                            {aiCalculating ? 'Calculating…' : 'Calculate with AI'}
                        </button>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        {(['calories', 'protein', 'fat', 'carbs', 'fiber'] as const).map(key => (
                            <div key={key} className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-gray-500 capitalize text-center">{key}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    {...register(`nutrition.${key}`, { required: true })}
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-1 text-sm font-semibold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                <span className="text-xs text-gray-400 text-center">
                                    {key === 'calories' ? 'kcal' : 'g'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {aiError && (
                        <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{aiError}</p>
                    )}

                    {aiBreakdown && aiBreakdown.length > 0 && (
                        <details className="mt-4 group">
                            <summary className="text-xs font-semibold text-gray-400 cursor-pointer select-none hover:text-gray-600 flex items-center gap-1">
                                <span className="transition-transform duration-150 group-open:rotate-90">▶</span>
                                AI breakdown per ingredient
                            </summary>
                            <div className="mt-2 overflow-x-auto rounded-xl border border-gray-100">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-400 uppercase tracking-wide">
                                            <th className="text-left px-3 py-2 font-semibold">Ingredient</th>
                                            <th className="text-right px-3 py-2 font-semibold">Original</th>
                                            <th className="text-right px-3 py-2 font-semibold">≈ g</th>
                                            <th className="text-right px-3 py-2 font-semibold">kcal</th>
                                            <th className="text-right px-3 py-2 font-semibold">Prot</th>
                                            <th className="text-right px-3 py-2 font-semibold">Fat</th>
                                            <th className="text-right px-3 py-2 font-semibold">Carbs</th>
                                            <th className="text-right px-3 py-2 font-semibold">Fiber</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {aiBreakdown.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                                                <td className="px-3 py-2 text-right text-gray-500">{row.original}</td>
                                                <td className="px-3 py-2 text-right text-gray-500">{row.grams}</td>
                                                <td className="px-3 py-2 text-right text-gray-700">{row.calories}</td>
                                                <td className="px-3 py-2 text-right text-gray-500">{row.protein}g</td>
                                                <td className="px-3 py-2 text-right text-gray-500">{row.fat}g</td>
                                                <td className="px-3 py-2 text-right text-gray-500">{row.carbs}g</td>
                                                <td className="px-3 py-2 text-right text-gray-500">{row.fiber}g</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    )}
                </section>

                {/* ─── Steps ─────────────────────────────────────────────── */}
                <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Steps</p>
                    <div className="flex flex-col gap-3">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleStepDragEnd}
                        >
                            <SortableContext
                                items={stepFields.map(f => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {stepFields.map((field, idx) => (
                                    <SortableStepRow key={field.id} id={field.id}>
                                        <span className="text-xs text-gray-400 pt-2.5 w-5 shrink-0 text-right font-semibold">{idx + 1}.</span>
                                        <textarea
                                            {...register(`steps.${idx}.value`, { required: true })}
                                            placeholder={`Step ${idx + 1}…`}
                                            rows={2}
                                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeStep(idx)}
                                            className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xl leading-none mt-0.5"
                                        >×</button>
                                    </SortableStepRow>
                                ))}
                            </SortableContext>
                        </DndContext>
                        <button
                            type="button"
                            onClick={() => addStep({ value: '' })}
                            className="text-sm text-brand-600 hover:text-brand-700 font-medium text-left mt-1"
                        >
                            + Add step
                        </button>
                    </div>
                </section>

                {/* ─── Substitutions ─────────────────────────────────────── */}
                <details className="group bg-white rounded-2xl border border-gray-200">
                    <summary className="flex items-center justify-between p-6 cursor-pointer select-none [list-style:none] [&::-webkit-details-marker]:hidden">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Substitutions</p>
                        <span className="text-gray-400 text-sm transition-transform duration-200 group-open:rotate-180">▾</span>
                    </summary>
                    <div className="px-6 pb-6">
                        <Controller
                            control={control}
                            name="substitutions"
                            render={({ field }) => (
                                <RichTextEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="e.g. Swap oat milk for any plant-based milk, or use maple syrup instead of honey…"
                                />
                            )}
                        />
                    </div>
                </details>

                {/* ─── Why this works ─────────────────────────────────────── */}
                <details className="group bg-white rounded-2xl border border-gray-200">
                    <summary className="flex items-center justify-between p-6 cursor-pointer select-none [list-style:none] [&::-webkit-details-marker]:hidden">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Why this works</p>
                        <span className="text-gray-400 text-sm transition-transform duration-200 group-open:rotate-180">▾</span>
                    </summary>
                    <div className="px-6 pb-6">
                        <Controller
                            control={control}
                            name="why_this_works"
                            render={({ field }) => (
                                <RichTextEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="e.g. Chia seeds absorb liquid overnight, creating a pudding-like texture that keeps you full…"
                                />
                            )}
                        />
                    </div>
                </details>

                </div>{/* ═══ end EN tab ═══ */}

                {/* ═══ RO tab — translations · "Tradu cu AI" per field ══════ */}
                <div className={cn('flex flex-col gap-6', lang === 'en' && 'hidden')}>
                    <section className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Traducere · Română</p>

                        {/* Name */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-gray-700">Nume</label>
                                <button type="button" onClick={() => trField(watch('name'), 'tr_name', 'name')}
                                    disabled={trBusy === 'name'}
                                    className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                                    {trBusy === 'name' ? '…' : 'Tradu cu AI'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mb-1 truncate">EN: {watch('name')}</p>
                            <input
                                {...register('tr_name')}
                                placeholder="Nume rețetă în română…"
                                className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        {/* Ingredients */}
                        {ingFields.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Ingrediente</p>
                                <div className="flex flex-col gap-2">
                                    {ingFields.map((field, idx) => (
                                        <div key={field.id} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 w-36 shrink-0 truncate">{watch(`ingredients.${idx}.name`)}</span>
                                            <input
                                                {...register(`tr_ingredients.${idx}.name`)}
                                                placeholder="în română…"
                                                className="flex-1 h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            />
                                            <button type="button"
                                                onClick={() => trField(watch(`ingredients.${idx}.name`), `tr_ingredients.${idx}.name`, `ing-${idx}`)}
                                                disabled={trBusy === `ing-${idx}`}
                                                className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                                                {trBusy === `ing-${idx}` ? '…' : 'Tradu cu AI'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Steps */}
                        {stepFields.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Pași</p>
                                <div className="flex flex-col gap-3">
                                    {stepFields.map((field, idx) => (
                                        <div key={field.id} className="flex gap-2 items-start">
                                            <span className="text-xs text-gray-400 pt-2.5 w-5 shrink-0 text-right font-semibold">{idx + 1}.</span>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400 mb-1">EN: {watch(`steps.${idx}.value`)}</p>
                                                <textarea
                                                    {...register(`tr_steps.${idx}.value`)}
                                                    rows={2}
                                                    placeholder="în română…"
                                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                                />
                                            </div>
                                            <button type="button"
                                                onClick={() => trField(watch(`steps.${idx}.value`), `tr_steps.${idx}.value`, `step-${idx}`)}
                                                disabled={trBusy === `step-${idx}`}
                                                className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 mt-5">
                                                {trBusy === `step-${idx}` ? '…' : 'Tradu cu AI'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Substitutions */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-gray-700">Substituții</label>
                                <button type="button" onClick={() => trField(watch('substitutions'), 'tr_substitutions', 'subs')}
                                    disabled={trBusy === 'subs'}
                                    className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                                    {trBusy === 'subs' ? '…' : 'Tradu cu AI'}
                                </button>
                            </div>
                            <Controller
                                control={control}
                                name="tr_substitutions"
                                render={({ field }) => (
                                    <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Substituții în română…" />
                                )}
                            />
                        </div>

                        {/* Why this works */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-gray-700">De ce funcționează</label>
                                <button type="button" onClick={() => trField(watch('why_this_works'), 'tr_why', 'why')}
                                    disabled={trBusy === 'why'}
                                    className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                                    {trBusy === 'why' ? '…' : 'Tradu cu AI'}
                                </button>
                            </div>
                            <Controller
                                control={control}
                                name="tr_why"
                                render={({ field }) => (
                                    <RichTextEditor value={field.value} onChange={field.onChange} placeholder="De ce funcționează în română…" />
                                )}
                            />
                        </div>
                    </section>
                </div>

                {/* ─── Footer actions ────────────────────────────────────── */}
                <div className="flex items-center justify-between pb-8">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.visit(route('admin.recipes'))}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" loading={isSubmitting}>
                        {isEdit ? 'Save changes' : 'Add Recipe'}
                    </Button>
                </div>

            </form>
        </div>
    );
}

RecipeForm.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
