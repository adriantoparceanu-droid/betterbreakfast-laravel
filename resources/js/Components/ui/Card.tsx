import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    elevated?: boolean;
}

export function Card({ elevated = false, className, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-white rounded-3xl border border-gray-100',
                elevated ? 'shadow-card-lg' : 'shadow-card',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('p-4', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn('font-semibold text-gray-900', className)} {...props}>
            {children}
        </h3>
    );
}
