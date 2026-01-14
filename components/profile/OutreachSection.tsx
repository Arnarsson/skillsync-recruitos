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
        <section className="pt-10 border-t border-slate-900 pb-12">
            <div className="mb-6">
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Outreach Strategy</h3>
            </div>

            {isOutreachUnlocked ? (
                <div className="bg-slate-900/20 border border-slate-900 rounded-lg p-6">
                    <div className="mb-6">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500/80 px-2 py-0.5 rounded border border-emerald-500/10 font-bold uppercase tracking-widest">Warm Intro Identified</span>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase mb-2 tracking-widest">Target Shared Context</div>
                            <div className="p-4 bg-slate-950 border border-slate-900 rounded text-xs text-slate-400 italic">
                                &quot;{candidate.connectionPath || 'Network check required'}&quot;
                            </div>
                        </div>
                        <button
                            onClick={() => onOpenOutreach(candidate)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 transition-colors uppercase tracking-widest"
                        >
                            Open Protocol
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900/10 border border-dashed border-slate-900 rounded-lg p-10 text-center">
                    <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">Protocol Locked</h3>
                    <p className="text-[11px] text-slate-600 mb-6 max-w-xs mx-auto italic">Unlock specific connection hooks and AI-generated coordination messages.</p>
                    <button
                        onClick={onUnlock}
                        className="px-8 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 rounded-full transition-all uppercase tracking-widest"
                    >
                        Unlock ({PRICING.OUTREACH} Credits)
                    </button>
                </div>
            )}
        </section>
    );
};
