import React from 'react';
import { Candidate } from '../../types';

interface RecommendationBannerProps {
    candidate: Candidate;
}

export const RecommendationBanner: React.FC<RecommendationBannerProps> = ({ candidate }) => {
    if (candidate.alignmentScore < 50) return null;

    const isHighScore = candidate.alignmentScore >= 75;

    return (
        <section>
            <div className={`rounded-lg p-5 border ${isHighScore
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-white/[0.08] bg-slate-800/30'
                }`}>
                <div className="flex items-start gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <h3 className={`text-sm font-medium ${isHighScore
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                                }`}>
                                {isHighScore
                                    ? 'Fast-Track Recommended'
                                    : 'Proceed with Caution'}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded border border-white/[0.08] text-slate-500 font-mono bg-slate-800/50">
                                {candidate.alignmentScore}%
                            </span>
                        </div>

                        {/* Why Now Section */}
                        {isHighScore && (
                            <div className="mb-6">
                                <h4 className="text-xs font-medium text-slate-500 mb-2">
                                    Primary Strengths
                                </h4>
                                <ul className="space-y-2">
                                    {candidate.persona?.careerTrajectory?.growthVelocity === 'rapid' && (
                                        <li className="text-xs text-slate-400 flex items-start">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2 flex-shrink-0" />
                                            <span>Rapid career growth trajectory advancing at 2x market pace</span>
                                        </li>
                                    )}
                                    {candidate.keyEvidence && candidate.keyEvidence.length > 0 && (
                                        <li className="text-xs text-slate-400 flex items-start">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 mr-2 flex-shrink-0" />
                                            <span>{candidate.keyEvidence[0]}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Interview Focus Areas */}
                        {candidate.risks && candidate.risks.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-slate-500 mb-2">
                                    Evaluation Focus
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {candidate.risks.slice(0, 2).map((risk, i) => (
                                        <div key={i} className="bg-slate-800/50 rounded-md p-3 border border-white/[0.05]">
                                            <div className="text-xs font-medium text-slate-500 mb-1">
                                                Validation {i + 1}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Probe: {risk.split(' ').slice(0, 5).join(' ')}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Next Steps CTA */}
                        <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                                Criteria: {candidate.scoreBreakdown ? '5' : '3'} Points
                            </div>
                            <button
                                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
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
