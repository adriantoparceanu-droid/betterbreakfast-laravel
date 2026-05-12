import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from '@inertiajs/react';
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

function LoginForm() {
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginFields>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFields) => {
        router.post(route('login'), data, {
            onError: (errs) => {
                if (errs.login) setError('login', { message: errs.login });
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
            <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
            />
            <Button type="submit" fullWidth loading={isSubmitting} size="lg" className="mt-1">
                Continue
            </Button>
        </form>
    );
}

// ─── Register form ────────────────────────────────────────────────────────────

function RegisterForm() {
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterFields>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = (data: RegisterFields) => {
        router.post(route('register'), data, {
            onError: (errs) => {
                if (errs.email)    setError('email',    { message: errs.email });
                if (errs.username) setError('username', { message: errs.username });
                if (errs.password) setError('password', { message: errs.password });
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

    return (
        <div className="min-h-screen bg-surface-raised flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🥣</div>
                    <h1 className="text-3xl font-bold text-gray-900">Better Breakfast</h1>
                    <p className="text-gray-500 mt-1 text-sm">10 days. 10 breakfasts. No decisions.</p>
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
                                {mode === 'login' ? <LoginForm /> : <RegisterForm />}
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
