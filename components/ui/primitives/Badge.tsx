import React, { HTMLAttributes, forwardRef } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    /** Dot indicator before text */
    withDot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-700 text-slate-300',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-400',
    info: 'bg-blue-500/10 text-blue-400',
};

const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-slate-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
};

/**
 * Badge component for status indicators and labels.
 *
 * @example
 * // Default badge
 * <Badge>Draft</Badge>
 *
 * // Success with dot
 * <Badge variant="success" withDot>Active</Badge>
 *
 * // Warning
 * <Badge variant="warning">Pending</Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = 'default', withDot = false, className = '', children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded';

        return (
            <span
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${className}`}
                {...props}
            >
                {withDot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
                )}
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

/**
 * Score badge with automatic color based on value
 */
interface ScoreBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    score: number;
    showLabel?: boolean;
}

export const ScoreBadge = forwardRef<HTMLSpanElement, ScoreBadgeProps>(
    ({ score, showLabel = false, className = '', ...props }, ref) => {
        const getVariant = (s: number): BadgeVariant => {
            if (s >= 80) return 'success';
            if (s >= 50) return 'warning';
            return 'danger';
        };

        const getLabel = (s: number): string => {
            if (s >= 80) return 'High';
            if (s >= 50) return 'Medium';
            return 'Low';
        };

        const variant = getVariant(score);

        return (
            <Badge ref={ref} variant={variant} className={className} {...props}>
                <span className="tabular-nums font-semibold">{score}</span>
                {showLabel && <span className="text-current/70">{getLabel(score)}</span>}
            </Badge>
        );
    }
);

ScoreBadge.displayName = 'ScoreBadge';

export default Badge;
