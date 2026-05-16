import { router } from '@inertiajs/react';

interface Props {
    content: string;
}

export default function PrivacyPolicy({ content }: Props) {
    return (
        <div className="min-h-screen bg-surface-raised">
            <div className="max-w-2xl mx-auto px-4 py-10">
                <button
                    onClick={() => router.visit(route('login'))}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Back
                </button>

                <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

                {content ? (
                    <div
                        className="text-sm text-gray-700 leading-relaxed rte-display"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                ) : (
                    <p className="text-gray-500 text-sm">Privacy policy not yet published.</p>
                )}
            </div>
        </div>
    );
}
