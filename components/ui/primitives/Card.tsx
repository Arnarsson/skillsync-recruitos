import React, { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Add hover state styling */
    hoverable?: boolean;
    /** Add padding (default: true) */
    padded?: boolean;
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Card component following design system.
 * Uses borders-only depth strategy.
 *
 * @example
 * <Card>
 *   <CardHeader>
 *     <h3>Title</h3>
 *   </CardHeader>
 *   <CardContent>
 *     Content goes here
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', hoverable = false, padded = true, children, ...props }, ref) => {
        const baseStyles = 'bg-slate-800/50 border border-white/[0.08] rounded-lg overflow-hidden';
        const hoverStyles = hoverable ? 'transition-colors hover:bg-slate-800/70 hover:border-white/[0.12]' : '';
        const paddingStyles = padded ? 'p-4' : '';

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${hoverStyles} ${paddingStyles} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

/**
 * Card header section
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`flex items-center justify-between pb-3 border-b border-white/[0.05] mb-3 ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card content section
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div ref={ref} className={className} {...props}>
                {children}
            </div>
        );
    }
);

CardContent.displayName = 'CardContent';

/**
 * Card footer section
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`flex items-center justify-end gap-2 pt-3 border-t border-white/[0.05] mt-3 ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardFooter.displayName = 'CardFooter';

export default Card;
