import React from 'react';
import { Candidate } from '../../types';

interface RecommendationBannerProps {
    candidate: Candidate;
}

export const RecommendationBanner: React.FC<RecommendationBannerProps> = ({ candidate }) => {
    if (candidate.alignmentScore < 50) return null;

    return (
        <section>
            <div className={`rounded-lg p-6 border ${candidate.alignmentScore >= 75
                ? 'border-emerald-500/20 bg-slate-900/30'
                : 'border-slate-800 bg-slate-900/30'
                }`}>
                <div className="flex items-start gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-6">
                            <h3 className={`text-sm font-semibold uppercase tracking-widest ${candidate.alignmentScore >= 75
                                ? 'text-emerald-500/80'
                                : 'text-slate-400'
                                }`}>
                                {candidate.alignmentScore >= 75
                                    ? 'Fast-Track Recommended'
                                    : 'Proceed with Caution'}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded border border-slate-800 text-slate-500 font-mono">
                                MATCH {candidate.alignmentScore}%
                            </span>
                        </div>

                        {/* Why Now Section */}
                        {candidate.alignmentScore >= 75 && (
                            <div className="mb-8">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                                    Primary Strengths
                                </h4>
                                <ul className="space-y-2">
                                    {candidate.persona?.careerTrajectory?.growthVelocity === 'rapid' && (
                                        <li className="text-xs text-slate-400 flex items-start">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mt-1 mr-3 flex-shrink-0" />
                                            <span>Rapid career growth trajectory advancing at 2x market pace</span>
                                        </li>
                                    )}
                                    {candidate.keyEvidence && candidate.keyEvidence.length > 0 && (
                                        <li className="text-xs text-slate-400 flex items-start">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1 mr-3 flex-shrink-0" />
                                            <span>{candidate.keyEvidence[0]}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Interview Focus Areas */}
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                                Evaluation Focus
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {candidate.risks && candidate.risks.length > 0 && candidate.risks.slice(0, 2).map((risk, i) => (
                                    <div key={i} className="bg-slate-950/50 rounded p-3 border border-slate-800/50">
                                        <div className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-tighter">
                                            Validation {i + 1}
                                        </div>
                                        <div className="text-xs text-slate-400 italic">
                                            Probe: {risk.split(' ').slice(0, 5).join(' ')}...
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Next Steps CTA */}
                        <div className="mt-8 pt-6 border-t border-slate-900/50 flex items-center justify-between">
                            <div className="text-[10px] text-slate-600 uppercase tracking-tight">
                                Criteria: 0{candidate.scoreBreakdown ? '5' : '3'} Points
                            </div>
                            <button
                                className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-200 transition-colors tracking-widest"
                                onClick={() => {
                                    const interviewSection = document.getElementById('interview-guide');
                                    if (interviewSection) interviewSection.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Open Guide
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
