import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { enqueueSync } from '@/lib/sync/queue';
import { track } from '@/lib/analytics';
import type { CheckInMood } from '@/types/app';

type Step = 'celebrate' | 'checkin' | 'done';

const moods: { value: CheckInMood; label: string; emoji: string }[] = [
    { value: 'energized', label: 'Energized',   emoji: '⚡' },
    { value: 'full',      label: 'Full',         emoji: '😊' },
    { value: 'hungry',    label: 'Still hungry', emoji: '😐' },
];

interface Props { day: number; }

export default function CompletePage({ day }: Props) {
    const dayNumber = Number(day);
    const { progress, userId, isHydrated, completeDay, checkIn, resetProgress } = useUserStore();
    const [step, setStep] = useState<Step>('celebrate');
    const [loading, setLoading] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        if (!isHydrated) return;
        if (progress.completedDays.includes(dayNumber)) {
            router.visit(route('today'), { replace: true });
        }
    }, [isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const t = setTimeout(() => setStep('checkin'), 1800);
        return () => clearTimeout(t);
    }, []);

    const handleMood = async (mood: CheckInMood) => {
        if (loading) return;
        setLoading(true);

        const recipeId = progress.selectedRecipes[dayNumber];
        const newCompletedDays = progress.completedDays.includes(dayNumber)
            ? progress.completedDays : [...progress.completedDays, dayNumber];
        const nextDay = Math.max(progress.currentDay, dayNumber + 1);
        const isLastDay = newCompletedDays.length >= 10;

        completeDay(dayNumber);
        checkIn(dayNumber, mood);

        if (userId) {
            enqueueSync(userId, 'PROGRESS_UPDATE', {
                completedDays: newCompletedDays,
                currentDay: nextDay,
                checkIns: { ...progress.checkIns, [dayNumber]: mood },
            });
            await track('COMPLETE_DAY', { dayNumber, fromRecipeId: recipeId });
        }

        if (isLastDay) {
            setStep('done');
        } else {
            router.visit(route('today'), { replace: true });
        }
    };

    const handleRestart = async () => {
        setResetting(true);
        try {
            const res = await fetch('/api/user/reset-plan', {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.status === 401) { router.visit(route('login')); return; }
            if (res.ok) { resetProgress(); router.visit(route('staples'), { replace: true }); }
        } catch {
            resetProgress(); router.visit(route('staples'), { replace: true });
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="fixed inset-0 overflow-hidden">
            <AnimatePresence mode="wait">
                {step === 'celebrate' && (
                    <motion.div key="celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }}
                        transition={{ duration: 0.25 }} onClick={() => setStep('checkin')}
                        className="absolute inset-0 bg-gradient-to-b from-brand-500 to-brand-600 flex flex-col items-center justify-center select-none">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15, stiffness: 260, damping: 18 }}
                            className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center mb-8">
                            <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', delay: 0.4, stiffness: 320, damping: 16 }}
                                className="text-7xl text-white leading-none">✓</motion.span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} className="text-center">
                            <p className="text-white/70 text-base font-medium mb-1">Day {dayNumber}</p>
                            <h1 className="text-white text-5xl font-bold tracking-tight">Complete</h1>
                        </motion.div>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="text-white/40 text-xs mt-20">Tap to continue</motion.p>
                    </motion.div>
                )}
                {step === 'checkin' && (
                    <motion.div key="checkin" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8">
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.35 }} className="w-full max-w-sm">
                            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1.5">How did this feel?</h2>
                            <p className="text-gray-400 text-sm text-center mb-10">Day {dayNumber} check-in</p>
                            <div className="flex flex-col gap-3">
                                {moods.map(({ value, label, emoji }, i) => (
                                    <motion.button key={value} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.22 + i * 0.07 }} onClick={() => handleMood(value)} disabled={loading}
                                        className="flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-brand-200 hover:bg-brand-50 active:scale-[0.97] transition-all duration-150 disabled:opacity-50 text-left">
                                        <span className="text-3xl">{emoji}</span>
                                        <span className="text-lg font-semibold text-gray-800">{label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {step === 'done' && (
                    <motion.div key="done" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8">
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
                            className="w-full max-w-sm flex flex-col items-center text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3, stiffness: 260, damping: 18 }}
                                className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center mb-8">
                                <span className="text-5xl">🏆</span>
                            </motion.div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">Nice work!</h2>
                            <p className="text-gray-500 text-base leading-relaxed mb-12">
                                You've completed your 10-day cycle.
                            </p>
                            <motion.button
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35 }}
                                onClick={handleRestart}
                                disabled={resetting}
                                className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.97] text-white font-semibold text-base py-4 rounded-2xl transition-all duration-150 disabled:opacity-50">
                                {resetting ? 'Starting…' : 'Start again'}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
