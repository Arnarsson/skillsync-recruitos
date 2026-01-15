import React from 'react';
import { Candidate, PRICING } from '../../types';

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
        <section className="pt-6 border-t border-white/[0.05] pb-8">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-medium text-slate-400">Outreach Strategy</h3>
                {isOutreachUnlocked && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                        Active
                    </span>
                )}
            </div>

            {isOutreachUnlocked ? (
                <div className="bg-slate-800/30 border border-white/[0.08] rounded-lg p-4">
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-2 flex items-center">
                                <i className="fa-solid fa-bullseye mr-1.5 text-blue-400"></i>
                                Shared Context
                            </div>
                            <div className="p-3 bg-slate-800/50 border border-white/[0.05] rounded-md text-xs text-slate-300">
                                {candidate.connectionPath || 'Network check required'}
                            </div>
                        </div>
                        <button
                            onClick={() => onOpenOutreach(candidate)}
                            className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center"
                        >
                            <i className="fa-solid fa-paper-plane mr-2"></i> Open Outreach
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800/30 border border-white/[0.08] border-dashed rounded-lg p-6 text-center">
                    <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center mx-auto mb-3 border border-white/[0.08]">
                        <i className="fa-solid fa-lock text-slate-500"></i>
                    </div>
                    <h3 className="text-sm font-medium text-slate-300 mb-1">Protocol Locked</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">Unlock connection hooks and AI-generated messages.</p>
                    <button
                        onClick={onUnlock}
                        className="h-8 px-4 text-xs font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700 border border-white/[0.08] rounded-md transition-colors"
                    >
                        Unlock · {PRICING.OUTREACH} Credits
                    </button>
                </div>
            )}
        </section>
    );
};
