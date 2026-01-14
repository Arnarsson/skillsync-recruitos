import React, { useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Candidate, PRICING } from '../../types';

interface AlignmentRadarProps {
    candidate: Candidate;
}

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
            <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2">
                <div className="flex items-center space-x-2">
                    <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Alignment Analysis</h3>
                </div>
            </div>

            <div className="bg-slate-900/10 rounded-lg p-6 border border-slate-900">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Visual Score (Radar) */}
                    <div className="w-full md:w-1/2 flex flex-col items-center">
                        <div className="relative w-full h-48">
                            {radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#1e293b" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9, fontWeight: 'medium' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Ideal"
                                            dataKey="ideal"
                                            stroke="#334155"
                                            fill="#334155"
                                            fillOpacity={0.05}
                                            strokeWidth={1}
                                            strokeDasharray="4 4"
                                        />
                                        <Radar
                                            name={candidate.name}
                                            dataKey="candidate"
                                            stroke="#94a3b8"
                                            fill="#94a3b8"
                                            fillOpacity={0.15}
                                            strokeWidth={1.5}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '10px', color: '#f1f5f9' }}
                                            formatter={(value: number, name: string) => [`${value}%`, name]}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-[10px] text-slate-600 uppercase tracking-widest">Missing Vector Data</div>
                            )}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <div className="text-2xl font-light text-slate-100">{candidate.alignmentScore}%</div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-4 text-[10px] uppercase tracking-tighter">
                            <div className="flex items-center text-slate-500">
                                <span className="w-2 h-0.5 bg-slate-400 mr-2"></span>
                                Candidate
                            </div>
                            <div className="flex items-center text-slate-700">
                                <span className="w-2 h-0.5 border-t border-dashed border-slate-600 mr-2"></span>
                                Benchmark
                            </div>
                        </div>
                    </div>

                    {/* Evidence List */}
                    <div className="w-full md:w-1/2 space-y-6">
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Critical Proof</h4>
                            <ul className="space-y-2">
                                {candidate.keyEvidence?.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-xs text-slate-400 leading-relaxed flex items-start">
                                        <span className="w-1 h-1 rounded-full bg-slate-700 mt-1.5 mr-3 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Vector Gaps</h4>
                            <ul className="space-y-2">
                                {candidate.risks?.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-xs text-slate-400 leading-relaxed flex items-start opacity-60">
                                        <span className="w-1 h-1 rounded-full bg-slate-800 mt-1.5 mr-3 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-900 text-[10px] text-slate-600 flex justify-between items-center uppercase tracking-widest">
                    <span>Engine v2.3</span>
                    <button onClick={() => setShowBreakdown(!showBreakdown)} className="hover:text-slate-400 font-bold transition-colors">
                        {showBreakdown ? 'Collapse Matrix' : 'Expand Matrix'}
                    </button>
                </div>

                {/* Score Breakdown */}
                {showBreakdown && candidate.scoreBreakdown && (
                    <div className="mt-8 space-y-3">
                        {[
                            { key: 'skills', label: 'Technical Vector' },
                            { key: 'experience', label: 'Tenure Vector' },
                            { key: 'industry', label: 'Domain Vector' },
                            { key: 'seniority', label: 'Hierarchy Vector' },
                            { key: 'location', label: 'Geographic Vector' }
                        ].map(({ key, label }) => {
                            const component = candidate.scoreBreakdown?.[key as keyof typeof candidate.scoreBreakdown];
                            if (!component) return null;

                            return (
                                <div key={key} className="bg-slate-950/40 rounded p-4 border border-slate-900 group">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
                                        <span className={`text-xs font-mono font-medium ${component.percentage >= 80 ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {component.percentage}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-900 h-0.5 rounded-full">
                                        <div
                                            className="h-full bg-slate-500 transition-all duration-1000"
                                            style={{ width: `${component.percentage}%` }}
                                        ></div>
                                    </div>
                                    {component.reasoning && (
                                        <div className="text-[11px] text-slate-500 leading-relaxed mt-4 italic opacity-80 pl-4 border-l border-slate-800">
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
