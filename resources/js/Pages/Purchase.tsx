import { router } from '@inertiajs/react';

interface Module {
    name: string;
    description: string;
    price: number;
}

interface Props {
    module: Module;
}

const INCLUDED = [
    '10 simple, nutritious breakfast recipes',
    'Day-by-day guided 10-day plan',
    'Shopping list (Staples)',
    'Offline access — works without internet',
    'Swap recipes you don\'t like',
];

export default function Purchase({ module }: Props) {
    const mailSubject = `Purchase: ${module.name}`;
    const mailBody    = `Hi,\n\nI'd like to purchase access to the ${module.name} (€${module.price.toFixed(2)}).\n\nMy registered email is: `;
    const mailtoHref  = `mailto:hello@betterbreakfast.eu?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm">

                {/* Logo / brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-brand-500 text-white text-2xl mb-3">
                        🥣
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Better Breakfast</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4">

                    {/* Header */}
                    <div className="px-6 pt-6 pb-5 border-b border-gray-50">
                        <h1 className="text-xl font-bold text-gray-900 mb-1">{module.name}</h1>
                        <p className="text-sm text-gray-500">{module.description}</p>
                    </div>

                    {/* Included */}
                    <div className="px-6 py-5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What's included</p>
                        <ul className="flex flex-col gap-2.5">
                            {INCLUDED.map(item => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                                    <span className="mt-0.5 w-4 h-4 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 text-xs">✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Price + CTA */}
                    <div className="px-6 pb-6">
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-gray-900">€{module.price.toFixed(2)}</span>
                            <span className="text-sm text-gray-400">one-time</span>
                        </div>
                        <a
                            href={mailtoHref}
                            className="block w-full text-center py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 active:scale-[0.98] transition-all"
                        >
                            Purchase access — €{module.price.toFixed(2)}
                        </a>
                        <p className="text-xs text-gray-400 text-center mt-3">
                            Send us an email and we'll activate your account within 24h.
                        </p>
                    </div>
                </div>

                {/* Already purchased */}
                <p className="text-xs text-center text-gray-400">
                    Already purchased?{' '}
                    <a href="mailto:hello@betterbreakfast.eu?subject=Activate my account" className="text-brand-500 hover:underline">
                        Contact us to activate
                    </a>
                </p>

                {/* Sign out */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => router.post(route('logout'))}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
