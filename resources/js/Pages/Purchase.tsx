import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useT } from '@/hooks/useT';
import { localized } from '@/lib/localize';

interface Module {
    id: string;
    name: string;
    description: string;
    price: number;
    translations?: Record<string, Record<string, string | undefined> | undefined> | null;
}

interface Props {
    module: Module;
    stripeStatus?: 'success' | 'canceled' | null;
}

const INCLUDED_KEYS = ['purchase.included1', 'purchase.included2', 'purchase.included3', 'purchase.included4', 'purchase.included5'];

export default function Purchase({ module, stripeStatus }: Props) {
    const { t, locale } = useT();
    const [loading, setLoading] = useState(false);
    const activating = stripeStatus === 'success';
    const moduleName = localized(locale, module.name, module.translations ?? null, 'name');
    const moduleDesc = localized(locale, module.description, module.translations ?? null, 'description');

    useEffect(() => {
        if (!activating) return;
        const id = setInterval(() => {
            router.visit(route('purchase') + '?stripe_success=1', { preserveState: false });
        }, 3000);
        return () => clearInterval(id);
    }, [activating]);

    const handleCheckout = () => {
        setLoading(true);
        router.post(route('purchase.checkout'), { type: 'module', id: module.id }, {
            onError: () => setLoading(false),
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm">

                {/* Logo / brand */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-3">
                        <img src="/icons/egg.png" alt="Better Breakfast" width={80} height={80} className="object-contain" />
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{t('purchase.brand')}</p>
                </div>

                {/* Status banners */}
                {activating && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-4 text-center">
                        <div className="flex justify-center mb-2">
                            <span className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-sm font-semibold text-green-700 mb-1">{t('purchase.paymentConfirmed')}</p>
                        <p className="text-xs text-green-600">{t('purchase.activatingAccount')}</p>
                    </div>
                )}

                {stripeStatus === 'canceled' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-4 text-center">
                        <p className="text-sm text-amber-700">{t('purchase.paymentCanceled')}</p>
                    </div>
                )}

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4">

                    {/* Header */}
                    <div className="px-6 pt-6 pb-5 border-b border-gray-50">
                        <h1 className="text-xl font-bold text-gray-900 mb-1">{moduleName}</h1>
                        <p className="text-sm text-gray-500">{moduleDesc}</p>
                    </div>

                    {/* Included */}
                    <div className="px-6 py-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('purchase.whatsIncluded')}</p>
                        <ul className="flex flex-col gap-2.5">
                            {INCLUDED_KEYS.map(k => (
                                <li key={k} className="flex items-start gap-2.5 text-sm text-gray-700">
                                    <span className="mt-0.5 w-4 h-4 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 text-xs">✓</span>
                                    {t(k)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Price + CTA */}
                    <div className="px-6 pb-6">
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-gray-900">€{module.price.toFixed(2)}</span>
                            <span className="text-sm text-gray-500">{t('purchase.oneTime')}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={loading || activating}
                            className="w-full flex items-center justify-center py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none gap-2"
                        >
                            {activating ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t('purchase.activating')}
                                </>
                            ) : loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t('purchase.redirectingStripe')}
                                </>
                            ) : (
                                t('purchase.purchaseAccess', { price: module.price.toFixed(2) })
                            )}
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-3">
                            {t('purchase.secureNote')}
                        </p>
                    </div>
                </div>

                {/* Already purchased */}
                <p className="text-xs text-center text-gray-500">
                    {t('purchase.alreadyPurchased')}{' '}
                    <a href="mailto:hello@betterbreakfast.eu?subject=Activate my account" className="text-brand-500 hover:underline">
                        {t('purchase.contactActivate')}
                    </a>
                </p>

                {/* Sign out */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => router.post(route('logout'))}
                        className="text-xs text-gray-500 hover:text-gray-600 transition-colors"
                    >
                        {t('purchase.signOut')}
                    </button>
                </div>
            </div>
        </div>
    );
}
