import { router } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';
import { useT } from '@/hooks/useT';
import AppLayout from '@/Layouts/AppLayout';

interface Step {
    id: string;
    optional?: boolean;
}

interface Section {
    titleKey: string;
    steps: Step[];
}

// Structure only — titles/descriptions live in locale dictionaries (foundation.steps.<id>).
const SECTIONS: Section[] = [
    {
        titleKey: 'foundation.sectionCook',
        steps: [
            { id: 'hard-boil-eggs' },
            { id: 'cook-chicken' },
            { id: 'cook-quinoa' },
        ],
    },
    {
        titleKey: 'foundation.sectionWash',
        steps: [
            { id: 'wash-leafy-greens' },
            { id: 'wash-fresh-herbs' },
            { id: 'wash-hardy-veg' },
        ],
    },
    {
        titleKey: 'foundation.sectionFinishing',
        steps: [
            { id: 'squeeze-lemon' },
            { id: 'extract-pomegranate' },
            { id: 'make-vinaigrette', optional: true },
        ],
    },
];

const ALL_STEPS = SECTIONS.flatMap((s) => s.steps);

export default function FoundationDayPage() {
    const { t } = useT();
    const { progress, toggleFoundationStep, completeFoundation } = useUserStore();
    const { foundationChecked, foundationDone } = progress;

    const checkedCount = ALL_STEPS.filter((s) => foundationChecked.includes(s.id)).length;
    const total = ALL_STEPS.length;
    const requiredSteps = ALL_STEPS.filter((s) => !s.optional);
    const allRequiredChecked = requiredSteps.every((s) => foundationChecked.includes(s.id));

    function handleGoToToday() {
        if (!allRequiredChecked) return;
        completeFoundation();
        router.visit(route('today'));
    }

    return (
        <div className="flex flex-col pb-nav">
            <div className="px-4 pt-4 pb-3">
                <div className="bg-white border border-gray-100 rounded-2xl px-4 pt-4 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('foundation.day0')}</p>
                            <h1 className="text-2xl font-bold text-gray-900">{t('foundation.title')}</h1>
                        </div>
                        <span className="text-sm text-gray-500 mt-1 tabular-nums">{t('foundation.doneCount', { checked: checkedCount, total })}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
                        <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-300"
                            style={{ width: `${total > 0 ? (checkedCount / total) * 100 : 0}%` }}
                        />
                    </div>
                    <div className="mt-3 space-y-1.5">
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {t('foundation.intro1')}
                        </p>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {t('foundation.intro2')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 flex flex-col gap-4">
                {SECTIONS.map(({ titleKey, steps }) => (
                    <div key={titleKey}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{t(titleKey)}</p>
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                            {steps.map((step) => {
                                const isChecked = foundationChecked.includes(step.id);
                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => toggleFoundationStep(step.id)}
                                        className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100"
                                    >
                                        <span className={cn(
                                            'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                            isChecked ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                                        )}>
                                            {isChecked && (
                                                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                                                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                                                </svg>
                                            )}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn('text-sm font-medium', isChecked ? 'text-gray-400 line-through' : 'text-gray-900')}>
                                                    {t(`foundation.steps.${step.id}.title`)}
                                                </span>
                                                {step.optional && (
                                                    <span className="text-xs text-gray-500">{t('foundation.optional')}</span>
                                                )}
                                            </div>
                                            <p className={cn('text-xs leading-relaxed mt-0.5', isChecked ? 'text-gray-400' : 'text-gray-500')}>
                                                {t(`foundation.steps.${step.id}.description`)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-4 mt-6 mb-2">
                {foundationDone ? (
                    <div className="bg-brand-50 rounded-2xl px-4 py-4 text-center">
                        <p className="text-sm font-semibold text-brand-700">{t('foundation.complete')}</p>
                        <p className="text-xs text-brand-500 mt-1">{t('foundation.running')}</p>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex flex-col items-center gap-3">
                        <p className="text-sm text-gray-500 text-center">
                            {allRequiredChecked
                                ? t('foundation.ready')
                                : t('foundation.progressMark', { checked: checkedCount, total })}
                        </p>
                        <button
                            onClick={handleGoToToday}
                            disabled={!allRequiredChecked}
                            className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {t('foundation.goToTodayRecipe')}
                        </button>
                        <button
                            onClick={() => router.visit(route('today'))}
                            className="text-xs text-gray-500 hover:text-gray-600 transition-colors duration-150"
                        >
                            {t('common.skipForNow')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

FoundationDayPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
