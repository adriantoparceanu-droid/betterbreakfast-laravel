import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
    primary:   'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
    secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 border border-brand-200',
    ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
    danger:    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
};

const sizeClasses: Record<Size, string> = {
    sm: 'h-9 px-4 text-sm rounded-xl',
    md: 'h-11 px-5 text-base rounded-2xl',
    lg: 'h-14 px-6 text-base rounded-2xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, className, disabled, children, ...props }, ref) => (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center font-semibold',
                'transition-all duration-150 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:pointer-events-none select-none',
                variantClasses[variant],
                sizeClasses[size],
                fullWidth && 'w-full',
                className,
            )}
            {...props}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {children}
                </span>
            ) : children}
        </button>
    ),
);

Button.displayName = 'Button';
export { Button };
