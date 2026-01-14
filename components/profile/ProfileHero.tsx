import React from 'react';
import { Candidate } from '../../types';

interface ProfileHeroProps {
    candidate: Candidate;
    onClose: () => void;
    onRefresh: () => void;
    onShare: () => void;
    onDownloadPDF: () => void;
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({
    candidate,
    onClose,
    onRefresh,
    onShare,
    onDownloadPDF
}) => {
    return (
        <div className="bg-transparent p-8 md:p-10 relative border-b border-slate-900">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Close profile"
            >
                <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            {/* Main Header Content */}
            <div className="mb-10">
                <h1 className="text-2xl font-semibold text-slate-100 mb-1 tracking-tight">{candidate.name}</h1>
                <p className="text-base text-slate-400 mb-4 font-medium">
                    {candidate.currentRole} <span className="text-slate-600 mx-1">·</span> {candidate.company}
                </p>
                <div className="flex items-center gap-6 text-xs text-slate-500 uppercase tracking-widest font-medium">
                    <span>{candidate.location}</span>
                    <span>{candidate.yearsExperience}Y Experience</span>
                </div>
            </div>

            {/* Alignment Score - Minimal */}
            <div className="mb-6">
                <div className="flex items-baseline justify-between mb-3">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                        Match Alignment
                    </div>
                    <div className="flex items-baseline gap-1">
                        <div className="text-3xl font-light text-slate-100 tabular-nums">
                            {candidate.alignmentScore}
                        </div>
                        <div className="text-sm text-slate-600">/ 100</div>
                    </div>
                </div>
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-slate-400 transition-all duration-1000 ease-out"
                        style={{ width: `${candidate.alignmentScore}%` }}
                    />
                </div>
            </div>

            {/* Archetype - Minimal */}
            {candidate.persona?.archetype && (
                <div className="border-t border-slate-900 pt-8">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Profile Strategy
                    </div>
                    <div className="text-lg font-medium text-slate-200 mb-3">
                        {candidate.persona.archetype}
                    </div>
                    <div className="text-sm text-slate-500 leading-relaxed italic">
                        &quot;{candidate.persona.reasoning?.substring(0, 180)}
                        {candidate.persona.reasoning && candidate.persona.reasoning.length > 180 ? '...' : ''}&quot;
                    </div>
                </div>
            )}

            {/* Action Buttons - Minimal */}
            <div className="flex items-center gap-3 mt-8 pt-8 border-t border-slate-900">
                <button
                    onClick={onRefresh}
                    className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors tracking-widest"
                >
                    Refresh
                </button>
                <button
                    onClick={onShare}
                    className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors tracking-widest"
                >
                    Share
                </button>
                <button
                    onClick={onDownloadPDF}
                    className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors tracking-widest"
                >
                    PDF
                </button>
            </div>
        </div>
    );
};
