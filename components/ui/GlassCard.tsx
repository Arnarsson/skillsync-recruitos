import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    variant?: 'dark' | 'light' | 'neo';
    hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    variant = 'dark',
    hoverEffect = false,
    ...props
}) => {
    // Base styles for glassmorphism
    const baseStyles = "backdrop-blur-md border rounded-xl overflow-hidden transition-all duration-300";

    // Variants
    const variants = {
        dark: "bg-slate-900/40 border-slate-800/50 shadow-xl shadow-black/20",
        light: "bg-white/10 border-white/20 shadow-lg",
        neo: "bg-gradient-to-br from-slate-900/80 to-slate-900/40 border-t border-l border-slate-700/50 shadow-2xl"
    };

    // Hover animation props
    const hoverProps = hoverEffect ? {
        whileHover: { y: -4, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)" }, // fixed shadow prop name too
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: "easeOut" as const }
    } : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 }
    };

    return (
        <motion.div
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...hoverProps}
            {...props}
        >
            {children}
        </motion.div>
    );
};
