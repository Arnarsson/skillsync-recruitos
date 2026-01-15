import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    /** @deprecated Use default styling. Variants removed for consistency. */
    variant?: 'dark' | 'light' | 'neo';
    /** @deprecated Hover effects removed. Use CSS hover states if needed. */
    hoverEffect?: boolean;
    /** Whether to animate on mount */
    animate?: boolean;
}

/**
 * Card component following design system.
 * Uses borders-only depth strategy - no shadows, no gradients.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    animate = true,
    ...props
}) => {
    // Single consistent style - borders only, no shadows
    const baseStyles = "bg-slate-800/50 border border-white/[0.08] rounded-lg overflow-hidden";

    // Simple fade-in animation
    const animationProps = animate ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, ease: "easeOut" as const }
    } : {};

    return (
        <motion.div
            className={`${baseStyles} ${className}`}
            {...animationProps}
            {...props}
        >
            {children}
        </motion.div>
    );
};
