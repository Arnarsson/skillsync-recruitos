import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Left icon or element */
    leftElement?: React.ReactNode;
    /** Right icon or element */
    rightElement?: React.ReactNode;
    /** Error state */
    hasError?: boolean;
    /** Full width */
    fullWidth?: boolean;
}

/**
 * Input component following design system.
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter your name" />
 *
 * // With left icon
 * <Input leftElement={<SearchIcon />} placeholder="Search..." />
 *
 * // With error state
 * <Input hasError placeholder="Email" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            leftElement,
            rightElement,
            hasError = false,
            fullWidth = false,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseStyles = 'h-9 bg-slate-900/50 border rounded-md text-sm text-white placeholder:text-slate-500 transition-colors';
        const focusStyles = 'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50';
        const borderStyles = hasError
            ? 'border-red-500/50'
            : 'border-white/[0.08] hover:border-white/[0.12]';
        const widthStyles = fullWidth ? 'w-full' : '';

        // Padding adjustments based on elements
        const paddingLeft = leftElement ? 'pl-9' : 'px-3';
        const paddingRight = rightElement ? 'pr-9' : 'px-3';

        return (
            <div className={`relative ${widthStyles}`}>
                {leftElement && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        {leftElement}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`${baseStyles} ${focusStyles} ${borderStyles} ${paddingLeft} ${paddingRight} ${widthStyles} ${className}`}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {rightElement}
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

/**
 * Textarea component following design system.
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean;
    fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ hasError = false, fullWidth = false, className = '', ...props }, ref) => {
        const baseStyles = 'bg-slate-900/50 border rounded-md text-sm text-white placeholder:text-slate-500 transition-colors p-3 min-h-[100px] resize-y';
        const focusStyles = 'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50';
        const borderStyles = hasError
            ? 'border-red-500/50'
            : 'border-white/[0.08] hover:border-white/[0.12]';
        const widthStyles = fullWidth ? 'w-full' : '';

        return (
            <textarea
                ref={ref}
                className={`${baseStyles} ${focusStyles} ${borderStyles} ${widthStyles} ${className}`}
                {...props}
            />
        );
    }
);

Textarea.displayName = 'Textarea';

/**
 * Select component following design system.
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    hasError?: boolean;
    fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ hasError = false, fullWidth = false, className = '', children, ...props }, ref) => {
        const baseStyles = 'h-9 bg-slate-900/50 border rounded-md text-sm text-white transition-colors appearance-none cursor-pointer px-3 pr-8';
        const focusStyles = 'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50';
        const borderStyles = hasError
            ? 'border-red-500/50'
            : 'border-white/[0.08] hover:border-white/[0.12]';
        const widthStyles = fullWidth ? 'w-full' : '';

        return (
            <div className={`relative ${widthStyles}`}>
                <select
                    ref={ref}
                    className={`${baseStyles} ${focusStyles} ${borderStyles} ${widthStyles} ${className}`}
                    {...props}
                >
                    {children}
                </select>
                {/* Chevron icon */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Input;
