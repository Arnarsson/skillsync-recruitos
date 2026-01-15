import React, { HTMLAttributes, forwardRef } from 'react';

interface ProfileCardProps extends HTMLAttributes<HTMLDivElement> {
    /** Candidate name */
    name: string;
    /** Current role/title */
    role: string;
    /** Company name */
    company?: string;
    /** Location */
    location?: string;
    /** Avatar URL or initials fallback */
    avatar?: string;
    /** Alignment score (0-100) */
    score?: number;
    /** Whether the card is selected */
    isSelected?: boolean;
    /** Click handler for the entire card */
    onCardClick?: () => void;
}

/**
 * Get initials from a name
 */
const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Get score color based on value
 */
const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
};

/**
 * Get score background based on value
 */
const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500/10';
    if (score >= 50) return 'bg-amber-500/10';
    return 'bg-red-500/10';
};

/**
 * ProfileCard component for displaying candidate information.
 * Follows design system with borders-only depth.
 *
 * @example
 * <ProfileCard
 *   name="Sarah Chen"
 *   role="Senior Software Engineer"
 *   company="Stripe"
 *   location="Copenhagen, Denmark"
 *   score={87}
 *   onCardClick={() => handleSelect(candidate)}
 * />
 */
export const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(
    (
        {
            name,
            role,
            company,
            location,
            avatar,
            score,
            isSelected = false,
            onCardClick,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseStyles = 'bg-slate-800/50 border rounded-lg p-4 transition-colors';
        const borderStyles = isSelected
            ? 'border-blue-500/50'
            : 'border-white/[0.08] hover:border-white/[0.12]';
        const interactiveStyles = onCardClick ? 'cursor-pointer hover:bg-slate-800/70' : '';

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${borderStyles} ${interactiveStyles} ${className}`}
                onClick={onCardClick}
                role={onCardClick ? 'button' : undefined}
                tabIndex={onCardClick ? 0 : undefined}
                onKeyDown={onCardClick ? (e) => e.key === 'Enter' && onCardClick() : undefined}
                {...props}
            >
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="shrink-0">
                        {avatar ? (
                            <img
                                src={avatar}
                                alt={name}
                                className="w-10 h-10 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-300">
                                {getInitials(name)}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="text-sm font-medium text-white truncate">
                                    {name}
                                </h3>
                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                    {role}
                                    {company && <span className="text-slate-500"> at {company}</span>}
                                </p>
                            </div>

                            {/* Score badge */}
                            {score !== undefined && (
                                <div className={`shrink-0 px-2 py-1 rounded ${getScoreBg(score)}`}>
                                    <span className={`text-sm font-semibold tabular-nums ${getScoreColor(score)}`}>
                                        {score}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        {location && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{location}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

ProfileCard.displayName = 'ProfileCard';

/**
 * Compact profile card for lists
 */
interface ProfileCardCompactProps extends HTMLAttributes<HTMLDivElement> {
    name: string;
    role: string;
    avatar?: string;
    score?: number;
    isSelected?: boolean;
    onCardClick?: () => void;
}

export const ProfileCardCompact = forwardRef<HTMLDivElement, ProfileCardCompactProps>(
    (
        {
            name,
            role,
            avatar,
            score,
            isSelected = false,
            onCardClick,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseStyles = 'flex items-center gap-3 p-3 rounded-lg transition-colors';
        const borderStyles = isSelected
            ? 'bg-blue-500/10'
            : 'hover:bg-white/[0.02]';
        const interactiveStyles = onCardClick ? 'cursor-pointer' : '';

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${borderStyles} ${interactiveStyles} ${className}`}
                onClick={onCardClick}
                role={onCardClick ? 'button' : undefined}
                tabIndex={onCardClick ? 0 : undefined}
                {...props}
            >
                {/* Avatar */}
                {avatar ? (
                    <img
                        src={avatar}
                        alt={name}
                        className="w-8 h-8 rounded-md object-cover shrink-0"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300 shrink-0">
                        {getInitials(name)}
                    </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                    <p className="text-xs text-slate-400 truncate">{role}</p>
                </div>

                {/* Score */}
                {score !== undefined && (
                    <span className={`text-sm font-semibold tabular-nums ${getScoreColor(score)}`}>
                        {score}
                    </span>
                )}
            </div>
        );
    }
);

ProfileCardCompact.displayName = 'ProfileCardCompact';

export default ProfileCard;
