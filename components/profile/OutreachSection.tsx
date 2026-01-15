import React from 'react';
import { motion } from 'framer-motion';
import { Candidate, PRICING } from '../../types';
import { GlassCard } from '../ui/GlassCard';

interface OutreachSectionProps {
    candidate: Candidate;
    isOutreachUnlocked: boolean;
    onUnlock: () => void;
    onOpenOutreach: (c: Candidate) => void;
}

export const OutreachSection: React.FC<OutreachSectionProps> = ({
    candidate,
    isOutreachUnlocked,
    onUnlock,
    onOpenOutreach
}) => {
    return (
        <section className="pt-8 border-t border-white/5 pb-12">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Outreach Strategy</h3>
                {isOutreachUnlocked && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-widest flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                        Active Protocol
                    </span>
                )}
            </div>

            {isOutreachUnlocked ? (
                <GlassCard variant="neo" className="p-1">
                    <div className="bg-slate-950/50 rounded-lg p-5">
                        <div className="space-y-5">
                            <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest flex items-center">
                                    <i className="fa-solid fa-bullseye mr-1.5 text-blue-400"></i>
                                    Target Shared Context
                                </div>
                                <div className="p-3 bg-black/40 border border-white/5 rounded text-xs text-slate-300 italic">
                                    &quot;{candidate.connectionPath || 'Network check required'}&quot;
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onOpenOutreach(candidate)}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/30 transition-all uppercase tracking-widest flex items-center justify-center"
                            >
                                <i className="fa-solid fa-paper-plane mr-2"></i> Open Command Center
                            </motion.button>
                        </div>
                    </div>
                </GlassCard>
            ) : (
                <GlassCard variant="light" className="p-8 text-center border-dashed border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                            <i className="fa-solid fa-lock text-slate-500"></i>
                        </div>
                        <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-widest">Protocol Locked</h3>
                        <p className="text-[11px] text-slate-500 mb-6 max-w-xs mx-auto">Unlock specific connection hooks and AI-generated coordination messages.</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onUnlock}
                            className="px-6 py-2 text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all uppercase tracking-widest backdrop-blur-md"
                        >
                            Unlock ({PRICING.OUTREACH} Credits)
                        </motion.button>
                    </div>
                </GlassCard>
            )}
        </section>
    );
};
