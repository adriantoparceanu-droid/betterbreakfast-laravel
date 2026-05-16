import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router, usePage } from '@inertiajs/react';
import { type PageProps } from '@/types';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Card, CardBody } from '@/Components/ui/Card';
import { useT } from '@/hooks/useT';

type Mode = 'login' | 'register';

// ─── Schemas ──────────────────────────────────────────────────────────────────

type Tr = (key: string, params?: Record<string, string | number>) => string;

const makeLoginSchema = (t: Tr) => z.object({
    login:    z.string().min(1, t('auth.errLoginRequired')),
    password: z.string().min(1, t('auth.errPasswordRequired')),
});

const makeRegisterSchema = (t: Tr) => z.object({
    email:    z.string().email(t('auth.errEmailInvalid')),
    username: z.string().min(2, t('auth.errUsernameMin')).max(30, t('auth.errUsernameMax')),
    password: z.string().min(8, t('auth.errPasswordMin')),
    password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
    message: t('auth.errPasswordsMatch'),
    path: ['password_confirmation'],
});

type LoginFields    = z.infer<ReturnType<typeof makeLoginSchema>>;
type RegisterFields = z.infer<ReturnType<typeof makeRegisterSchema>>;

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ siteKey }: { siteKey: string }) {
    const { t } = useT();
    const captchaRef = useRef<HCaptcha>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaError, setCaptchaError] = useState<string | null>(null);

    const schema = useMemo(() => makeLoginSchema(t), [t]);
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginFields>({
        resolver: zodResolver(schema),
    });

    const onSubmit = (data: LoginFields) => {
        if (!captchaToken) {
            setCaptchaError(t('auth.captchaRequired'));
            return;
        }
        setCaptchaError(null);

        router.post(route('login'), { ...data, hcaptcha_token: captchaToken }, {
            onError: (errs) => {
                if (errs.login) setError('login', { message: errs.login });
                captchaRef.current?.resetCaptcha();
                setCaptchaToken(null);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
                label={t('auth.emailOrUsername')}
                type="text"
                autoComplete="username"
                placeholder={t('auth.emailOrUsernamePlaceholder')}
                error={errors.login?.message}
                {...register('login')}
            />
            <div className="flex flex-col gap-1">
                <Input
                    label={t('auth.password')}
                    type="password"
                    autoComplete="current-password"
                    placeholder={t('auth.passwordDots')}
                    error={errors.password?.message}
                    {...register('password')}
                />
                <div className="text-right">
                    <a
                        href={route('password.request')}
                        className="text-xs text-gray-500 hover:text-gray-600 transition-colors"
                    >
                        {t('auth.forgotPassword')}
                    </a>
                </div>
            </div>
            <div className="flex flex-col items-center gap-1">
                <HCaptcha
                    ref={captchaRef}
                    sitekey={siteKey}
                    onVerify={(token) => { setCaptchaToken(token); setCaptchaError(null); }}
                    onExpire={() => setCaptchaToken(null)}
                />
                {captchaError && (
                    <p className="text-sm text-red-500">{captchaError}</p>
                )}
            </div>
            <Button type="submit" fullWidth loading={isSubmitting} size="lg" className="mt-1">
                {t('auth.continue')}
            </Button>
        </form>
    );
}

// ─── Register form ────────────────────────────────────────────────────────────

function RegisterForm({ siteKey }: { siteKey: string }) {
    const { t } = useT();
    const captchaRef = useRef<HCaptcha>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaError, setCaptchaError] = useState<string | null>(null);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [privacyError, setPrivacyError] = useState<string | null>(null);

    const schema = useMemo(() => makeRegisterSchema(t), [t]);
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterFields>({
        resolver: zodResolver(schema),
    });

    const onSubmit = (data: RegisterFields) => {
        if (!captchaToken) {
            setCaptchaError(t('auth.captchaRequired'));
            return;
        }
        if (!privacyAccepted) {
            setPrivacyError(t('auth.privacyRequired'));
            return;
        }
        setCaptchaError(null);
        setPrivacyError(null);

        router.post(route('register'), { ...data, hcaptcha_token: captchaToken, privacy_policy: '1' }, {
            onError: (errs) => {
                if (errs.email)    setError('email',    { message: errs.email });
                if (errs.username) setError('username', { message: errs.username });
                if (errs.password) setError('password', { message: errs.password });
                captchaRef.current?.resetCaptcha();
                setCaptchaToken(null);
            },
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                placeholder={t('auth.emailPlaceholder')}
                error={errors.email?.message}
                {...register('email')}
            />
            <Input
                label={t('auth.username')}
                type="text"
                autoComplete="username"
                placeholder={t('auth.usernamePlaceholder')}
                error={errors.username?.message}
                {...register('username')}
            />
            <Input
                label={t('auth.password')}
                type="password"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={t('auth.passwordMin')}
                error={errors.password?.message}
                {...register('password')}
            />
            <Input
                label={t('auth.confirmPassword')}
                type="password"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={t('auth.passwordDots')}
                error={errors.password_confirmation?.message}
                {...register('password_confirmation')}
            />
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={e => { setPrivacyAccepted(e.target.checked); if (e.target.checked) setPrivacyError(null); }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                    {t('auth.iAgreeTo')}{' '}
                    <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
                        onClick={e => e.stopPropagation()}
                    >
                        {t('auth.privacyPolicy')}
                    </a>
                </span>
            </label>
            {privacyError && (
                <p className="text-sm text-red-500 -mt-2">{privacyError}</p>
            )}
            <div className="flex flex-col items-center gap-1">
                <HCaptcha
                    ref={captchaRef}
                    sitekey={siteKey}
                    onVerify={(token) => { setCaptchaToken(token); setCaptchaError(null); }}
                    onExpire={() => setCaptchaToken(null)}
                />
                {captchaError && (
                    <p className="text-sm text-red-500">{captchaError}</p>
                )}
            </div>
            <Button type="submit" fullWidth loading={isSubmitting} size="lg" className="mt-1">
                {t('auth.continue')}
            </Button>
        </form>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
    mode?: Mode;
    status?: string;
}

export default function AuthPage({ mode: initialMode = 'login', status }: Props) {
    const { t } = useT();
    const [mode, setMode] = useState<Mode>(initialMode);
    const { hcaptcha_site_key } = usePage<PageProps<{ hcaptcha_site_key: string }>>().props;

    return (
        <div className="min-h-screen bg-surface-raised flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-3">
                        <img src="/icons/egg.png" alt="Better Breakfast" width={80} height={80} className="object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('auth.brand')}</h1>
                    <p className="text-gray-500 mt-1 text-sm">{t('auth.tagline')}</p>
                </div>

                <Card elevated>
                    <CardBody className="p-6">
                        {/* Toggle tabs */}
                        <div className="relative flex bg-gray-100 rounded-2xl p-1 mb-6">
                            <motion.div
                                className="absolute top-1 bottom-1 rounded-xl bg-white shadow-sm"
                                layoutId="auth-tab"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                style={{ width: 'calc(50% - 4px)', left: mode === 'login' ? 4 : 'calc(50%)' }}
                            />
                            {(['login', 'register'] as Mode[]).map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMode(m)}
                                    className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-xl transition-colors duration-150 ${
                                        mode === m ? 'text-gray-900' : 'text-gray-500'
                                    }`}
                                >
                                    {m === 'login' ? t('auth.signIn') : t('auth.createAccount')}
                                </button>
                            ))}
                        </div>

                        {status && (
                            <p className="text-sm text-green-600 text-center mb-4">{status}</p>
                        )}

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                            >
                                {mode === 'login'
                                    ? <LoginForm siteKey={hcaptcha_site_key} />
                                    : <RegisterForm siteKey={hcaptcha_site_key} />
                                }
                            </motion.div>
                        </AnimatePresence>
                    </CardBody>
                </Card>

                {/* Privacy note */}
                <p className="text-center text-xs text-gray-500 mt-5 px-4">
                    {t('auth.privacyNote')}
                </p>
            </div>
        </div>
    );
}
