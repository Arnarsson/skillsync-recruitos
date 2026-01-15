
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

export const ProfileHero: React.FC<ProfileHeroProps> = ({
    candidate,
    onClose,
    onRefresh,
    onShare,
    onDownloadPDF
}) => {
    return (
        <div className="bg-transparent p-6 md:p-8 relative border-b border-white/5">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full w-8 h-8 flex items-center justify-center z-10"
                aria-label="Close profile"
            >
                <i className="fa-solid fa-xmark text-sm"></i>
            </button>

            {/* Main Header Content */}
            <div className="mb-8 pr-10">
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{candidate.name}</h1>
                <p className="text-sm text-slate-300 mb-4 font-medium flex items-center">
                    <span className="text-emerald-400 mr-2"><i className="fa-solid fa-briefcase"></i></span>
                    {candidate.currentRole}
                    <span className="text-slate-600 mx-2">|</span>
                    <span className="text-slate-300">{candidate.company}</span>
                </p>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    <span className="bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center">
                        <i className="fa-solid fa-location-dot mr-1.5 text-slate-500"></i> {candidate.location}
                    </span>
                    <span className="bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center">
                        <i className="fa-solid fa-clock mr-1.5 text-slate-500"></i> {candidate.yearsExperience}Y Exp
                    </span>
                </div>
            </div>

            {/* Alignment Score - Enhanced */}
            <div className="mb-8 bg-gradient-to-r from-emerald-900/20 to-transparent p-4 rounded-xl border border-emerald-500/10">
                <div className="flex items-baseline justify-between mb-3">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center">
                        <i className="fa-solid fa-crosshairs mr-2"></i> Match Alignment
                    </div>
                    <div className="flex items-baseline gap-1">
                        <div className="text-4xl font-light text-white tabular-nums drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                            {candidate.alignmentScore}
                        </div>
                        <div className="text-xs text-slate-500 font-bold mb-1">/ 100</div>
                    </div>
                </div>
                <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${candidate.alignmentScore}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                </div>
            </div>

            {/* Archetype - Glass Style */}
            {candidate.persona?.archetype && (
                <div className="mb-8">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Profile Strategy
                    </div>
                    <div className="bg-white/5 border-l-2 border-purple-500 p-4 rounded-r-lg">
                        <div className="text-base font-bold text-white mb-2 flex items-center">
                            <i className="fa-solid fa-chess-knight text-purple-400 mr-2 text-sm"></i>
                            {candidate.persona.archetype}
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed italic opacity-80">
                            &quot;{candidate.persona.reasoning?.substring(0, 150)}...&quot;
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons - Glass Row */}
            <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRefresh}
                    className="flex-1 py-2 bg-white/5 text-[10px] uppercase font-bold text-slate-300 rounded border border-white/10 transition-colors tracking-widest flex items-center justify-center"
                >
                    <i className="fa-solid fa-rotate-right mr-2 text-slate-500"></i> Refresh
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onShare}
                    className="flex-1 py-2 bg-white/5 text-[10px] uppercase font-bold text-slate-300 rounded border border-white/10 transition-colors tracking-widest flex items-center justify-center"
                >
                    <i className="fa-solid fa-share-nodes mr-2 text-slate-500"></i> Share
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDownloadPDF}
                    className="flex-1 py-2 bg-white/5 text-[10px] uppercase font-bold text-slate-300 rounded border border-white/10 transition-colors tracking-widest flex items-center justify-center"
                >
                    <i className="fa-solid fa-file-pdf mr-2 text-slate-500"></i> PDF
                </motion.button>
            </div>
        </div>
    );
};
