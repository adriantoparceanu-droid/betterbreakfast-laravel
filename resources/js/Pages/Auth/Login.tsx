import { useRef, useState } from 'react';
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

type Mode = 'login' | 'register';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
    login:    z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
    email:    z.string().email('Enter a valid email'),
    username: z.string().min(2, 'At least 2 characters').max(30, 'Max 30 characters'),
    password: z.string().min(8, 'At least 8 characters'),
    password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});

type LoginFields    = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registerSchema>;

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ siteKey }: { siteKey: string }) {
    const captchaRef = useRef<HCaptcha>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaError, setCaptchaError] = useState<string | null>(null);

    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginFields>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFields) => {
        if (!captchaToken) {
            setCaptchaError('Please complete the CAPTCHA.');
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
                label="Email or username"
                type="text"
                autoComplete="username"
                placeholder="you@example.com or alex"
                error={errors.login?.message}
                {...register('login')}
            />
            <div className="flex flex-col gap-1">
                <Input
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...register('password')}
                />
                <div className="text-right">
                    <a
                        href={route('password.request')}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Forgot password?
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
                Continue
            </Button>
        </form>
    );
}

// ─── Register form ────────────────────────────────────────────────────────────

function RegisterForm({ siteKey }: { siteKey: string }) {
    const captchaRef = useRef<HCaptcha>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaError, setCaptchaError] = useState<string | null>(null);

    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterFields>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = (data: RegisterFields) => {
        if (!captchaToken) {
            setCaptchaError('Please complete the CAPTCHA.');
            return;
        }
        setCaptchaError(null);

        router.post(route('register'), { ...data, hcaptcha_token: captchaToken }, {
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
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
            />
            <Input
                label="Username"
                type="text"
                autoComplete="username"
                placeholder="e.g. alex"
                error={errors.username?.message}
                {...register('username')}
            />
            <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                error={errors.password?.message}
                {...register('password')}
            />
            <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                error={errors.password_confirmation?.message}
                {...register('password_confirmation')}
            />
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
                Continue
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
    const [mode, setMode] = useState<Mode>(initialMode);
    const { hcaptcha_site_key } = usePage<PageProps<{ hcaptcha_site_key: string }>>().props;

    return (
        <div className="min-h-screen bg-surface-raised flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-3">
                        {/* Fried egg — organic blob, no background */}
                        <svg width="76" height="76" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <defs>
                                <radialGradient id="bb-yolk" cx="38%" cy="32%" r="68%">
                                    <stop offset="0%"   stopColor="#FFE57F" />
                                    <stop offset="45%"  stopColor="#FFAB00" />
                                    <stop offset="100%" stopColor="#E65C00" />
                                </radialGradient>
                                <radialGradient id="bb-white" cx="52%" cy="38%" r="72%">
                                    <stop offset="0%"   stopColor="#FFFFFF" />
                                    <stop offset="80%"  stopColor="#F7F0E0" />
                                    <stop offset="100%" stopColor="#EDE4CE" />
                                </radialGradient>
                            </defs>

                            {/* egg white — organic irregular blob */}
                            <path
                                d="M62 8
                                   C 76 6, 96 14, 100 28
                                   C 104 38, 104 50, 99 60
                                   C 95 68, 108 74, 101 85
                                   C 94 96, 81 100, 68 100
                                   C 57 100, 47 97, 38 91
                                   C 27 84, 17 74, 15 62
                                   C 13 50, 18 38, 16 28
                                   C 14 18, 22 10, 34 9
                                   C 44 8, 48 10, 62 8 Z"
                                fill="url(#bb-white)"
                                stroke="#DDD3BA"
                                strokeWidth="1.2"
                            />

                            {/* yolk */}
                            <circle cx="62" cy="56" r="25" fill="url(#bb-yolk)" />

                            {/* yolk highlight — soft glow */}
                            <ellipse cx="53" cy="46" rx="11" ry="7.5"
                                fill="rgba(255,255,255,0.32)"
                                transform="rotate(-25,53,46)"
                            />
                            {/* yolk specular dot */}
                            <circle cx="51" cy="44" r="4.5" fill="rgba(255,255,255,0.62)" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Better Breakfast</h1>
                    <p className="text-gray-500 mt-1 text-sm">10 days. 10 breakfasts. One system.</p>
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
                                        mode === m ? 'text-gray-900' : 'text-gray-400'
                                    }`}
                                >
                                    {m === 'login' ? 'Sign in' : 'Create account'}
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
                <p className="text-center text-xs text-gray-400 mt-5 px-4">
                    Used only for access and account recovery
                </p>
            </div>
        </div>
    );
}
