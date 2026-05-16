import { router } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';
import AppLayout from '@/Layouts/AppLayout';

interface Step {
    id: string;
    title: string;
    description: string;
    optional?: boolean;
}

interface Section {
    title: string;
    steps: Step[];
}

const SECTIONS: Section[] = [
    {
        title: 'Cook',
        steps: [
            {
                id: 'hard-boil-eggs',
                title: 'Hard-Boil Eggs',
                description: 'Cool completely. Store unpeeled in the fridge for up to 7 days.',
            },
            {
                id: 'cook-chicken',
                title: 'Cook Chicken Breast',
                description: 'Cool completely, then cube. Store in a glass container in the fridge for up to 4 days, or freeze for up to 4 months.',
            },
            {
                id: 'cook-quinoa',
                title: 'Cook Quinoa',
                description: 'Cool completely. Store in a glass container in the fridge for up to 5 days, or freeze for up to 2 months.',
            },
        ],
    },
    {
        title: 'Wash & Prep',
        steps: [
            {
                id: 'wash-leafy-greens',
                title: 'Wash Leafy Greens',
                description: 'Wash in a salad spinner and air-dry thoroughly. Store in unsealed plastic bags lined with paper towels in the crisper drawer. Replace damp towels mid-week. Best for 5–7 days.',
            },
            {
                id: 'wash-fresh-herbs',
                title: 'Wash Fresh Herbs',
                description: 'Ensure herbs are bone-dry. Chop and store in a glass container (not airtight) for up to 5 days.',
            },
            {
                id: 'wash-hardy-veg',
                title: 'Wash Hardy Vegetables',
                description: '(Tomatoes, cucumbers, peppers, radishes, green onions). Pat dry and store in the crisper drawer for up to 7 days. Note: For best flavor, store whole tomatoes at room temperature.',
            },
        ],
    },
    {
        title: 'Finishing Touches',
        steps: [
            {
                id: 'squeeze-lemon',
                title: 'Squeeze Lemon Juice',
                description: 'Squeeze and store in an airtight glass jar for up to 4 days for peak flavor (safe up to 7, but it turns bitter).',
            },
            {
                id: 'extract-pomegranate',
                title: 'Extract Pomegranate Seeds',
                description: 'Store in an airtight glass jar in the fridge for up to 5 days.',
            },
            {
                id: 'make-vinaigrette',
                title: 'Make Vinaigrette',
                description: 'Mix 1 part lemon juice, 1 part olive oil, salt, and pepper. Store in a glass jar for up to 7 days. Shake well before using. Use 1 tbsp to quickly season recipes instead of adding ingredients separately.',
                optional: true,
            },
        ],
    },
];

const ALL_STEPS = SECTIONS.flatMap((s) => s.steps);

export default function FoundationDayPage() {
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
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Day 0</p>
                            <h1 className="text-2xl font-bold text-gray-900">Foundation Day</h1>
                        </div>
                        <span className="text-sm text-gray-500 mt-1 tabular-nums">{checkedCount}/{total} done</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
                        <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-300"
                            style={{ width: `${total > 0 ? (checkedCount / total) * 100 : 0}%` }}
                        />
                    </div>
                    <div className="mt-3 space-y-1.5">
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Prep your basics now to ensure you save time later in the week. Getting this done today means you won't skip a recipe when you are short on time.
                        </p>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Follow the steps in order, especially storage instructions — they determine how well the week runs.
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 flex flex-col gap-4">
                {SECTIONS.map(({ title, steps }) => (
                    <div key={title}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{title}</p>
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
                                                    {step.title}
                                                </span>
                                                {step.optional && (
                                                    <span className="text-xs text-gray-500">(optional)</span>
                                                )}
                                            </div>
                                            <p className={cn('text-xs leading-relaxed mt-0.5', isChecked ? 'text-gray-400' : 'text-gray-500')}>
                                                {step.description}
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
                        <p className="text-sm font-semibold text-brand-700">Foundation Day complete ✓</p>
                        <p className="text-xs text-brand-500 mt-1">Your plan is running. Keep going!</p>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex flex-col items-center gap-3">
                        <p className="text-sm text-gray-500 text-center">
                            {allRequiredChecked
                                ? "You're ready to start your plan."
                                : `${checkedCount} of ${total} steps done — mark all required steps to continue.`}
                        </p>
                        <button
                            onClick={handleGoToToday}
                            disabled={!allRequiredChecked}
                            className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Go to today's recipe
                        </button>
                        <button
                            onClick={() => router.visit(route('today'))}
                            className="text-xs text-gray-500 hover:text-gray-600 transition-colors duration-150"
                        >
                            Skip for now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

FoundationDayPage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
