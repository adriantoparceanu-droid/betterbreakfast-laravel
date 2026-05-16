import { useState } from 'react';
import { motion } from 'framer-motion';
import { router } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { enqueueSync } from '@/lib/sync/queue';
import { Button } from '@/Components/ui/Button';
import { useT } from '@/hooks/useT';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 8;

const bulletKeys = ['onboarding.bullet1', 'onboarding.bullet2', 'onboarding.bullet3', 'onboarding.bullet4'];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } } };

export default function OnboardingPage() {
    const { t } = useT();
    const { completeOnboarding, userId, progress } = useUserStore();
    const [servings, setServings] = useState(progress.defaultServings ?? 1);
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        setLoading(true);
        completeOnboarding(servings);
        if (userId) enqueueSync(userId, 'PROGRESS_UPDATE', { defaultServings: servings });
        router.visit(route('staples'), { replace: true });
    };

    return (
        <div className="min-h-screen bg-surface-raised flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-8">

                    {/* Logo */}
                    <motion.div variants={item} className="flex justify-center">
                        <img src="/icons/egg.png" alt="Better Breakfast" width={72} height={72} className="object-contain" />
                    </motion.div>

                    {/* Intro copy */}
                    <motion.div variants={item} className="flex flex-col gap-5">
                        <p className="text-gray-700 text-base leading-relaxed">
                            {t('onboarding.intro')}
                        </p>
                        <ul className="flex flex-col gap-2">
                            {bulletKeys.map((k) => (
                                <li key={k} className="flex items-start gap-2.5 text-gray-700 text-base">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                                    {t(k)}
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-col gap-0.5 text-gray-400 text-sm">
                            <span>{t('onboarding.noTracking')}</span>
                            <span>{t('onboarding.noComplexity')}</span>
                            <span>{t('onboarding.noDecisions')}</span>
                        </div>
                    </motion.div>

                    {/* Servings picker */}
                    <motion.div variants={item} className="flex flex-col gap-3">
                        <p className="text-base font-semibold text-gray-800">
                            {t('onboarding.howManyPersons')}
                        </p>
                        <div className="flex items-center justify-between gap-4 bg-white rounded-2xl shadow-sm px-6 py-5">
                            <button
                                onClick={() => setServings((s) => Math.max(MIN_SERVINGS, s - 1))}
                                disabled={servings <= MIN_SERVINGS}
                                className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 text-2xl font-semibold flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                            >
                                −
                            </button>
                            <motion.span
                                key={servings}
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="text-5xl font-bold text-brand-600 w-16 text-center tabular-nums"
                            >
                                {servings}
                            </motion.span>
                            <button
                                onClick={() => setServings((s) => Math.min(MAX_SERVINGS, s + 1))}
                                disabled={servings >= MAX_SERVINGS}
                                className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 text-2xl font-semibold flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 text-center">
                            {t('onboarding.listAdapts')}
                        </p>
                    </motion.div>

                    {/* CTA */}
                    <motion.div variants={item}>
                        <Button fullWidth size="lg" loading={loading} onClick={handleStart}>
                            {t('onboarding.setUpKitchen')}
                        </Button>
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
}
