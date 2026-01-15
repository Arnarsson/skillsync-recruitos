import React from 'react';

/**
 * Skeleton loader that mimics the candidate card structure
 * Displayed during AI processing operations (sourcing, import, persona generation)
 */
export const CandidateCardSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 rounded-xl border bg-apex-800/40 border-apex-700 animate-pulse">
            {/* Candidate Info Skeleton */}
            <div className="col-span-4 flex items-center space-x-3">
                {/* Avatar */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-apex-700 flex-shrink-0"></div>

                {/* Name & Role */}
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-apex-700 rounded w-3/4"></div>
                    <div className="h-3 bg-apex-700/60 rounded w-1/2"></div>
                    <div className="flex items-center space-x-2 mt-2">
                        <div className="h-3 bg-apex-700/50 rounded w-16"></div>
                        <div className="h-3 bg-apex-700/50 rounded w-20"></div>
                    </div>
                </div>
            </div>

            {/* Score Skeleton */}
            <div className="col-span-2 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-apex-700 mb-2"></div>
                <div className="h-2 bg-apex-700/60 rounded w-16"></div>
            </div>

            {/* Summary Skeleton */}
            <div className="col-span-4 space-y-2">
                <div className="h-3 bg-apex-700/60 rounded w-full"></div>
                <div className="h-3 bg-apex-700/60 rounded w-5/6"></div>
                <div className="h-3 bg-apex-700/60 rounded w-4/6"></div>
                <div className="flex space-x-2 mt-3">
                    <div className="h-5 bg-apex-700/50 rounded w-20"></div>
                    <div className="h-5 bg-apex-700/50 rounded w-16"></div>
                </div>
            </div>

            {/* Action Skeleton */}
            <div className="col-span-2 flex justify-end items-center">
                <div className="h-8 bg-apex-700/60 rounded w-24"></div>
            </div>
        </div>
    );
};
