import React from 'react';
import { motion } from 'framer-motion';
import { Candidate } from '../../types';

interface ProfileHeroProps {
    candidate: Candidate;
    onClose: () => void;
    onRefresh: () => void;
    onShare: () => void;
    onDownloadPDF: () => void;
}

// Score color helper
const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
};

const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
};

export const ProfileHero: React.FC<ProfileHeroProps> = ({
    candidate,
    onClose,
    onRefresh,
    onShare,
    onDownloadPDF
}) => {
    return (
        <div className="p-6 md:p-8 relative border-b border-white/[0.05]">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 w-8 h-8 rounded-md bg-slate-800/50 hover:bg-slate-700 border border-white/[0.08] text-slate-400 hover:text-white transition-colors flex items-center justify-center z-10"
                aria-label="Close profile"
            >
                <i className="fa-solid fa-xmark text-sm"></i>
            </button>

            {/* Main Header Content */}
            <div className="mb-6 pr-10">
                <h1 className="text-2xl font-semibold text-white mb-2">{candidate.name}</h1>
                <p className="text-sm text-slate-300 mb-3 flex items-center">
                    <span className="text-slate-400 mr-2"><i className="fa-solid fa-briefcase"></i></span>
                    {candidate.currentRole}
                    <span className="text-slate-600 mx-2">·</span>
                    <span className="text-slate-400">{candidate.company}</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="bg-slate-800/50 px-2 py-1 rounded border border-white/[0.08] flex items-center">
                        <i className="fa-solid fa-location-dot mr-1.5 text-slate-500"></i> {candidate.location}
                    </span>
                    <span className="bg-slate-800/50 px-2 py-1 rounded border border-white/[0.08] flex items-center">
                        <i className="fa-solid fa-clock mr-1.5 text-slate-500"></i> {candidate.yearsExperience}Y Exp
                    </span>
                </div>
            </div>

            {/* Alignment Score */}
            <div className="mb-6 bg-slate-800/30 border border-white/[0.08] p-4 rounded-lg">
                <div className="flex items-baseline justify-between mb-3">
                    <div className="text-xs font-medium text-slate-400 flex items-center">
                        <i className="fa-solid fa-crosshairs mr-2"></i> Match Alignment
                    </div>
                    <div className="flex items-baseline gap-1">
                        <div className={`text-3xl font-semibold tabular-nums ${getScoreColor(candidate.alignmentScore)}`}>
                            {candidate.alignmentScore}
                        </div>
                        <div className="text-xs text-slate-500">/ 100</div>
                    </div>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${candidate.alignmentScore}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${getScoreBarColor(candidate.alignmentScore)}`}
                    />
                </div>
            </div>

            {/* Archetype */}
            {candidate.persona?.archetype && (
                <div className="mb-6">
                    <div className="text-xs font-medium text-slate-500 mb-2">
                        Profile Strategy
                    </div>
                    <div className="bg-slate-800/30 border-l-2 border-blue-500/50 p-4 rounded-r-lg border border-white/[0.08]">
                        <div className="text-sm font-medium text-white mb-1 flex items-center">
                            <i className="fa-solid fa-chess-knight text-blue-400 mr-2"></i>
                            {candidate.persona.archetype}
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed">
                            {candidate.persona.reasoning?.substring(0, 150)}...
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/[0.05]">
                <button
                    onClick={onRefresh}
                    className="flex-1 h-8 bg-slate-800/50 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-md border border-white/[0.08] transition-colors flex items-center justify-center"
                >
                    <i className="fa-solid fa-rotate-right mr-2 text-slate-500"></i> Refresh
                </button>
                <button
                    onClick={onShare}
                    className="flex-1 h-8 bg-slate-800/50 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-md border border-white/[0.08] transition-colors flex items-center justify-center"
                >
                    <i className="fa-solid fa-share-nodes mr-2 text-slate-500"></i> Share
                </button>
                <button
                    onClick={onDownloadPDF}
                    className="flex-1 h-8 bg-slate-800/50 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-md border border-white/[0.08] transition-colors flex items-center justify-center"
                >
                    <i className="fa-solid fa-file-pdf mr-2 text-slate-500"></i> PDF
                </button>
            </div>
        </div>
    );
};
