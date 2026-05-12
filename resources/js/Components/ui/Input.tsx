import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className, id, ...props }, ref) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'h-12 w-full rounded-2xl border bg-white px-4 text-base text-gray-900',
                        'placeholder:text-gray-400 transition-colors duration-150',
                        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
                        'disabled:opacity-50 disabled:bg-gray-50',
                        error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 hover:border-gray-300',
                        className,
                    )}
                    {...props}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
            </div>
        );
    },
);

Input.displayName = 'Input';
export { Input };
