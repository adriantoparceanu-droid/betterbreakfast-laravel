import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { router, usePage } from '@inertiajs/react';
import { useUserStore } from '@/store/userStore';
import { enqueueSync } from '@/lib/sync/queue';
import type { PageProps } from '@/types/index.d';

interface Props { isOpen: boolean; onClose: () => void; }
type Step = 'menu' | 'confirm';

export function SettingsModal({ isOpen, onClose }: Props) {
    const [step, setStep] = useState<Step>('menu');
    const [loading, setLoading] = useState(false);
    const { auth } = usePage<PageProps>().props;
    const { resetProgress, userId, progress } = useUserStore();

    function handleClose() {
        onClose();
        setTimeout(() => setStep('menu'), 300);
    }

    async function handleRestart() {
        if (loading) return;
        setLoading(true);
        resetProgress();
        if (userId) {
            enqueueSync(userId, 'PROGRESS_UPDATE', {
                completedDays: [], currentDay: 1, selectedRecipes: {},
                usedRecipeIds: [], checkIns: {}, pantryChecked: [],
                defaultServings: progress.defaultServings,
                foundationDone: false, foundationChecked: [],
            });
        }
        handleClose();
        router.visit(route('today'));
    }

    function handleSignOut() {
        resetProgress();
        router.post(route('logout'));
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/40 z-40" onClick={handleClose} />
                    <motion.div key="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl">
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-9 h-1 rounded-full bg-gray-200" />
                        </div>
                        <AnimatePresence mode="wait">
                            {step === 'menu' && (
                                <motion.div key="menu" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="px-4 pb-24">
                                    <div className="flex items-center justify-between py-3 mb-1">
                                        <h2 className="text-lg font-bold text-gray-900">Settings</h2>
                                        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors text-lg">×</button>
                                    </div>
                                    {auth?.user?.email && <p className="text-xs text-gray-400 mb-4 px-1">{auth.user.email}</p>}
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => setStep('confirm')} className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all duration-150 text-left">
                                            <span className="text-xl">🔄</span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Restart plan</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Reset progress, keep settings</p>
                                            </div>
                                        </button>
                                        <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-150 text-left">
                                            <span className="text-xl">🚪</span>
                                            <p className="text-sm font-semibold text-gray-900">Sign out</p>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                            {step === 'confirm' && (
                                <motion.div key="confirm" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="px-4 pb-24">
                                    <div className="flex items-center gap-2 py-3 mb-4">
                                        <button onClick={() => setStep('menu')} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors text-base">←</button>
                                        <h2 className="text-lg font-bold text-gray-900">Restart plan</h2>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4 mb-5">
                                        <p className="text-sm font-semibold text-orange-800 mb-1">Restart the 10-day plan?</p>
                                        <p className="text-xs text-orange-600 leading-relaxed">Your progress, completed days, and pantry checklist will be reset. Your serving size and account will be kept.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setStep('menu')} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                                        <button onClick={handleRestart} disabled={loading} className="flex-1 py-3 rounded-2xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-[0.97] transition-all disabled:opacity-50">
                                            {loading ? 'Restarting…' : 'Restart'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
