import React from 'react';
import { Candidate } from '../../types';

interface QualityBadgeProps {
    candidate: Candidate;
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({ candidate }) => {
    let score = 0;

    // Check presence of key fields
    if (candidate.currentRole && candidate.currentRole !== 'N/A') score += 20;
    if (candidate.yearsExperience && candidate.yearsExperience > 0) score += 20;
    if (candidate.persona?.careerTrajectory) score += 20;
    if (candidate.persona?.skillProfile?.coreSkills && candidate.persona.skillProfile.coreSkills.length > 0) score += 20;
    if (candidate.scoreConfidence === 'high') score += 20;

    const label = score >= 70 ? 'Complete' : score >= 40 ? 'Partial' : 'Minimal';
    const colorClass = score >= 70
        ? 'bg-emerald-500/5 text-emerald-500/70 border-emerald-500/10'
        : score >= 40
            ? 'bg-amber-500/5 text-amber-500/70 border-amber-500/10'
            : 'bg-slate-500/5 text-slate-500/70 border-slate-500/10';

    return (
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider border ${colorClass}`}>
            {label} profile
        </span>
    );
};
