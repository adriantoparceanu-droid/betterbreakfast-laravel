import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext, sortableKeyboardCoordinates, useSortable,
    verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useRecipes } from '@/hooks/useRecipes';
import { cn, formatQty, convertUnit } from '@/lib/utils';
import { useT } from '@/hooks/useT';
import { localizeRecipe } from '@/lib/localize';
import AppLayout from '@/Layouts/AppLayout';
import type { Recipe } from '@/types/app';

// ─── Sortable future day card ─────────────────────────────────────────────────

interface SortableCardProps {
    day: number;
    recipe: Recipe | undefined;
    onOpenModal: (recipe: Recipe) => void;
}

function SortableFutureDayCard({ day, recipe, onOpenModal }: SortableCardProps) {
    const { t } = useT();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: String(day) });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                'bg-white border border-gray-100 rounded-2xl flex items-center transition-all duration-150',
                'hover:border-brand-200 hover:shadow-sm',
                isDragging && 'opacity-40 shadow-lg',
            )}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                tabIndex={-1}
                className="pl-3 pr-1 py-3 text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none shrink-0"
            >
                <GripVertical size={16} />
            </button>

            <div
                onClick={() => recipe && onOpenModal(recipe)}
                className="flex flex-1 items-center gap-3 px-3 py-3 min-w-0 cursor-pointer"
            >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 bg-gray-100 text-gray-500">
                    {day}
                </div>
                <div className="flex-1 min-w-0">
                    {recipe ? (
                        <>
                            <p className="font-semibold text-sm truncate text-gray-900">{recipe.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{t('plan.kcal', { n: recipe.nutrition.calories })}</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">{t('plan.notSet')}</p>
                    )}
                </div>
                <span className="text-gray-300 text-base shrink-0">{recipe ? '›' : '+'}</span>
            </div>
        </div>
    );
}

// ─── Recipe detail modal ──────────────────────────────────────────────────────

interface RecipeModalProps {
    recipe: Recipe;
    defaultServings: number;
    onClose: () => void;
}

const SECTION_CLS = 'rounded-xl border border-gray-100 overflow-hidden';
const ROW_CLS = 'w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer select-none font-semibold text-sm text-gray-700';
const CHEVRON_CLS = 'text-gray-400 text-xs transition-transform duration-200';

type ModalSection = 'ing' | 'steps' | 'subs' | 'why' | null;

function RecipeModal({ recipe, defaultServings, onClose }: RecipeModalProps) {
    const { t } = useT();
    const scale = defaultServings / (recipe.baseServings || 1);
    // Accordion: opening one section collapses the others.
    const [open, setOpen] = useState<ModalSection>('ing');
    const toggle = (s: Exclude<ModalSection, null>) => setOpen(prev => (prev === s ? null : s));

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[88dvh] flex flex-col overflow-hidden shadow-xl">

                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg leading-tight">{recipe.name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {t('plan.kcal', { n: Math.round(recipe.nutrition.calories * scale) })}
                            {' · '}{t(defaultServings !== 1 ? 'plan.servingMany' : 'plan.servingOne', { n: defaultServings })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0 transition-colors mt-0.5"
                    >✕</button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">

                    {/* Ingredients */}
                    <div className={SECTION_CLS}>
                        <button type="button" onClick={() => toggle('ing')} className={ROW_CLS}>
                            {t('common.ingredients')}
                            <span className={`${CHEVRON_CLS} ${open === 'ing' ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                        {open === 'ing' && (
                            <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5">
                                {recipe.ingredients.map((ing, i) => {
                                    const { qty, unit } = convertUnit(ing.quantity * scale, ing.unit, 'metric');
                                    return (
                                        <div key={i} className="flex items-baseline gap-2 text-sm">
                                            <span className="font-semibold text-gray-900 tabular-nums shrink-0">
                                                {formatQty(qty)} {unit}
                                            </span>
                                            <span className="text-gray-600">{ing.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Steps */}
                    <div className={SECTION_CLS}>
                        <button type="button" onClick={() => toggle('steps')} className={ROW_CLS}>
                            {t('common.steps')}
                            <span className={`${CHEVRON_CLS} ${open === 'steps' ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                        {open === 'steps' && (
                            <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                                {recipe.steps.map((step, i) => (
                                    <div key={i} className="flex gap-3 text-sm">
                                        <span className="font-bold text-brand-600 shrink-0 tabular-nums">{i + 1}.</span>
                                        <p className="text-gray-700 leading-relaxed">{step}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Substitutions — only if present */}
                    {recipe.substitutions && (
                        <div className={SECTION_CLS}>
                            <button type="button" onClick={() => toggle('subs')} className={ROW_CLS}>
                                {t('common.substitutions')}
                                <span className={`${CHEVRON_CLS} ${open === 'subs' ? 'rotate-180' : ''}`}>▾</span>
                            </button>
                            {open === 'subs' && (
                                <div className="px-4 pb-4 pt-1">
                                    <div
                                        className="text-sm text-gray-700 leading-relaxed rte-display"
                                        dangerouslySetInnerHTML={{ __html: recipe.substitutions }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Why this works — only if present */}
                    {recipe.whyThisWorks && (
                        <div className={SECTION_CLS}>
                            <button type="button" onClick={() => toggle('why')} className={ROW_CLS}>
                                {t('common.whyThisWorks')}
                                <span className={`${CHEVRON_CLS} ${open === 'why' ? 'rotate-180' : ''}`}>▾</span>
                            </button>
                            {open === 'why' && (
                                <div className="px-4 pb-4 pt-1">
                                    <div
                                        className="text-sm text-gray-700 leading-relaxed rte-display"
                                        dangerouslySetInnerHTML={{ __html: recipe.whyThisWorks }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanPage() {
    const { t, locale } = useT();
    const { progress, updateProgress } = useUserStore();
    const { currentDay, completedDays, selectedRecipes, checkIns, foundationDone, foundationChecked, defaultServings } = progress;
    const rawRecipes = useRecipes();
    const recipes = rawRecipes.map((r) => localizeRecipe(r, locale));
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));
    const [modalRecipe, setModalRecipe] = useState<Recipe | null>(null);

    // Plan is a pure preview/reorder screen — recipe assignment is owned by
    // useEnsurePlanAssigned() (AppLayout). Drag-to-reorder below is a user action.

    // DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const futureDays = Array.from({ length: 10 }, (_, i) => i + 1).filter(d => d > currentDay);

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (!over || active.id === over.id) return;
        const fromIdx = futureDays.indexOf(Number(active.id));
        const toIdx   = futureDays.indexOf(Number(over.id));
        if (fromIdx === -1 || toIdx === -1) return;

        const recipeOrder = futureDays.map(d => selectedRecipes[d]);
        const newOrder    = arrayMove(recipeOrder, fromIdx, toIdx);
        const newSelected = { ...selectedRecipes };
        futureDays.forEach((d, i) => { newSelected[d] = newOrder[i]; });
        updateProgress({ selectedRecipes: newSelected });
    }

    const moodLabel: Record<string, string> = { energized: t('plan.moodEnergized'), full: t('plan.moodFull'), hungry: t('plan.moodHungry') };

    return (
        <>
            <div className="flex flex-col pb-nav">
                <div className="px-4 pt-4 pb-3">
                    <h1 className="text-2xl font-bold text-gray-900">{t('plan.title')}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{t('plan.daysComplete', { count: completedDays.length })}</p>
                    <div className="flex gap-1 mt-3">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((day) => (
                            <div key={day} className={cn('flex-1 h-1.5 rounded-full transition-colors duration-300',
                                completedDays.includes(day) ? 'bg-brand-500' : day === currentDay ? 'bg-brand-200' : 'bg-gray-100')} />
                        ))}
                    </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={futureDays.map(String)} strategy={verticalListSortingStrategy}>
                        <div className="px-4 flex flex-col gap-2">

                            {/* Day 0 — Foundation */}
                            <div
                                onClick={() => router.visit(route('foundation-day'))}
                                className={cn('bg-white border rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-150 cursor-pointer',
                                    foundationDone ? 'border-gray-100 hover:border-gray-200' : 'border-brand-300 ring-1 ring-brand-200 shadow-sm hover:border-brand-400'
                                )}
                            >
                                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0',
                                    foundationDone ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-700')}>
                                    {foundationDone ? '✓' : '0'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn('font-semibold text-sm', foundationDone ? 'text-gray-500' : 'text-gray-900')}>{t('plan.foundationDay')}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {foundationDone ? t('plan.prepComplete') : t('plan.stepsDone', { count: foundationChecked.length })}
                                    </p>
                                </div>
                                {!foundationDone && (
                                    <span className="shrink-0 text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{t('plan.prep')}</span>
                                )}
                            </div>

                            {/* Days 1–10 */}
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((day) => {
                                const isDone   = completedDays.includes(day);
                                const isToday  = day === currentDay;
                                const isFuture = day > currentDay;
                                const isPast   = day < currentDay && !isDone;
                                const recipeId = selectedRecipes[day];
                                const recipe   = recipeId ? recipeMap.get(recipeId) : undefined;
                                const mood     = checkIns[day];

                                if (isFuture) {
                                    return (
                                        <SortableFutureDayCard
                                            key={day}
                                            day={day}
                                            recipe={recipe}
                                            onOpenModal={setModalRecipe}
                                        />
                                    );
                                }

                                // Static card — done / today / past
                                return (
                                    <div
                                        key={day}
                                        onClick={() => { if (isToday) router.visit(route('today')); }}
                                        className={cn('bg-white border rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-150',
                                            isDone  && 'border-gray-100',
                                            isToday && 'border-brand-300 ring-1 ring-brand-200 shadow-sm cursor-pointer',
                                            isPast  && 'border-gray-100 opacity-50',
                                        )}
                                    >
                                        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0',
                                            isDone ? 'bg-brand-500 text-white' : isToday ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500')}>
                                            {isDone ? '✓' : day}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {recipe ? (
                                                <>
                                                    <p className={cn('font-semibold text-sm truncate', isDone || isPast ? 'text-gray-500' : 'text-gray-900')}>{recipe.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{isDone && mood ? moodLabel[mood] : t('plan.kcal', { n: recipe.nutrition.calories })}</p>
                                                </>
                                            ) : (
                                                <p className={cn('text-sm', isToday ? 'text-gray-500' : 'text-gray-400')}>
                                                    {isToday ? t('plan.goToToday') : '—'}
                                                </p>
                                            )}
                                        </div>
                                        {isToday && <span className="shrink-0 text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{t('plan.today')}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {modalRecipe && (
                <RecipeModal
                    recipe={modalRecipe}
                    defaultServings={defaultServings}
                    onClose={() => setModalRecipe(null)}
                />
            )}
        </>
    );
}

PlanPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
