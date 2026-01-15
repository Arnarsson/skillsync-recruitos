import React, { useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Candidate } from '../../types';

interface AlignmentRadarProps {
    candidate: Candidate;
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

export const AlignmentRadar: React.FC<AlignmentRadarProps> = ({ candidate }) => {
    const [showBreakdown, setShowBreakdown] = useState(true);

    const radarData = candidate.scoreBreakdown ? [
        {
            subject: 'Skills',
            candidate: candidate.scoreBreakdown.skills?.percentage || 0,
            ideal: 100,
            fullMark: 100
        },
        {
            subject: 'Exp.',
            candidate: candidate.scoreBreakdown.experience?.percentage || 0,
            ideal: 100,
            fullMark: 100
        },
        {
            subject: 'Industry',
            candidate: candidate.scoreBreakdown.industry?.percentage || 0,
            ideal: 100,
            fullMark: 100
        },
        {
            subject: 'Seniority',
            candidate: candidate.scoreBreakdown.seniority?.percentage || 0,
            ideal: 100,
            fullMark: 100
        },
        {
            subject: 'Location',
            candidate: candidate.scoreBreakdown.location?.percentage || 0,
            ideal: 100,
            fullMark: 100
        },
    ] : [];

    return (
        <section>
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-2">
                <h3 className="text-xs font-medium text-slate-400">Alignment Analysis</h3>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-5 border border-white/[0.08]">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Visual Score (Radar) */}
                    <div className="w-full md:w-1/2 flex flex-col items-center">
                        <div className="relative w-full h-56">
                            {radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Ideal"
                                            dataKey="ideal"
                                            stroke="#334155"
                                            fill="#334155"
                                            fillOpacity={0.1}
                                            strokeWidth={1}
                                            strokeDasharray="4 4"
                                        />
                                        <Radar
                                            name={candidate.name}
                                            dataKey="candidate"
                                            stroke="#10b981"
                                            fill="#10b981"
                                            fillOpacity={0.2}
                                            strokeWidth={2}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.08)', fontSize: '12px', color: '#f1f5f9', borderRadius: '6px' }}
                                            formatter={(value: number, name: string) => [`${value}%`, name]}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-slate-500">Missing Vector Data</div>
                            )}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <div className={`text-2xl font-semibold ${getScoreColor(candidate.alignmentScore)}`}>{candidate.alignmentScore}%</div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                            <div className="flex items-center text-emerald-400">
                                <span className="w-3 h-0.5 bg-emerald-400 mr-2"></span>
                                Candidate
                            </div>
                            <div className="flex items-center text-slate-500">
                                <span className="w-3 h-0.5 border-t border-dashed border-slate-500 mr-2"></span>
                                Benchmark
                            </div>
                        </div>
                    </div>

                    {/* Evidence List */}
                    <div className="w-full md:w-1/2 space-y-5">
                        <div>
                            <h4 className="text-xs font-medium text-emerald-400 mb-2">Key Evidence</h4>
                            <ul className="space-y-2">
                                {candidate.keyEvidence?.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-medium text-amber-400 mb-2">Gaps</h4>
                            <ul className="space-y-2">
                                {candidate.risks?.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-xs text-slate-400 leading-relaxed flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 mr-2 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-3 border-t border-white/[0.05] text-xs text-slate-500 flex justify-between items-center">
                    <span>Engine v2.3</span>
                    <button onClick={() => setShowBreakdown(!showBreakdown)} className="hover:text-white font-medium transition-colors">
                        {showBreakdown ? 'Hide Details' : 'Show Details'}
                    </button>
                </div>

                {/* Score Breakdown */}
                {showBreakdown && candidate.scoreBreakdown && (
                    <div className="mt-5 space-y-3">
                        {[
                            { key: 'skills', label: 'Technical' },
                            { key: 'experience', label: 'Experience' },
                            { key: 'industry', label: 'Industry' },
                            { key: 'seniority', label: 'Seniority' },
                            { key: 'location', label: 'Location' }
                        ].map(({ key, label }) => {
                            const component = candidate.scoreBreakdown?.[key as keyof typeof candidate.scoreBreakdown];
                            if (!component) return null;

                            return (
                                <div key={key} className="bg-slate-800/50 rounded-md p-3 border border-white/[0.05]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-slate-400">{label}</span>
                                        <span className={`text-xs font-mono ${component.percentage >= 80 ? 'text-emerald-400' : component.percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                            {component.percentage}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${getScoreBarColor(component.percentage)}`}
                                            style={{ width: `${component.percentage}%` }}
                                        ></div>
                                    </div>
                                    {component.reasoning && (
                                        <div className="text-xs text-slate-500 leading-relaxed mt-2 pl-3 border-l border-white/[0.05]">
                                            {component.reasoning}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};
