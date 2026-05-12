import { useState } from 'react';
import { motion } from 'framer-motion';
import { router } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { enqueueSync } from '@/lib/sync/queue';
import { Button } from '@/Components/ui/Button';
import { Card, CardBody } from '@/Components/ui/Card';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 8;

export default function OnboardingPage() {
    const { completeOnboarding, userId, progress } = useUserStore();
    const [servings, setServings] = useState(progress.defaultServings ?? 1);
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        setLoading(true);
        completeOnboarding(servings);
        if (userId) enqueueSync(userId, 'PROGRESS_UPDATE', { defaultServings: servings });
        router.visit(route('staples'), { replace: true });
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } } };

    return (
        <div className="min-h-screen bg-surface-raised flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
                    <motion.div variants={item} className="text-center">
                        <div className="text-6xl mb-4">🥣</div>
                        <h1 className="text-3xl font-bold text-gray-900">Better Breakfast</h1>
                        <p className="text-gray-500 mt-2 text-sm leading-relaxed">10 days. 10 breakfasts. No decisions.</p>
                    </motion.div>

                    <motion.div variants={item}>
                        <Card elevated>
                            <CardBody className="p-6">
                                <p className="text-sm font-semibold text-gray-700 mb-1 text-center">How many servings per recipe?</p>
                                <p className="text-xs text-gray-400 text-center mb-5">Ingredients will be scaled to match</p>
                                <div className="flex items-center justify-center gap-6">
                                    <button onClick={() => setServings((s) => Math.max(MIN_SERVINGS, s - 1))} disabled={servings <= MIN_SERVINGS}
                                        className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 text-2xl font-semibold flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform">−</button>
                                    <motion.span key={servings} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="text-5xl font-bold text-brand-600 w-16 text-center tabular-nums">{servings}</motion.span>
                                    <button onClick={() => setServings((s) => Math.min(MAX_SERVINGS, s + 1))} disabled={servings >= MAX_SERVINGS}
                                        className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 text-2xl font-semibold flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform">+</button>
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-4">{servings === 1 ? 'Just for me' : `For ${servings} people`}</p>
                            </CardBody>
                        </Card>
                    </motion.div>

                    <motion.div variants={item}>
                        <Button fullWidth size="lg" loading={loading} onClick={handleStart}>Start 10-Day Plan</Button>
                    </motion.div>

                    <motion.p variants={item} className="text-center text-xs text-gray-400 px-4">
                        You can change this anytime in Settings
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
