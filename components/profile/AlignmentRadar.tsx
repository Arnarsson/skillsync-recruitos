import React, { useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Candidate } from '../../types';

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
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center space-x-2">
                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Alignment Analysis</h3>
                </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Visual Score (Radar) */}
                    <div className="w-full md:w-1/2 flex flex-col items-center">
                        <div className="relative w-full h-56">
                            {radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
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
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', fontSize: '12px', color: '#f1f5f9', borderRadius: '8px', backdropFilter: 'blur(8px)' }}
                                            formatter={(value: number, name: string) => [`${value}%`, name]}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-[10px] text-slate-500 uppercase tracking-widest">Missing Vector Data</div>
                            )}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <div className="text-3xl font-light text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{candidate.alignmentScore}%</div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-4 text-[10px] uppercase tracking-tighter">
                            <div className="flex items-center text-emerald-400">
                                <span className="w-2 h-0.5 bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                Candidate
                            </div>
                            <div className="flex items-center text-slate-500">
                                <span className="w-2 h-0.5 border-t border-dashed border-slate-500 mr-2"></span>
                                Benchmark
                            </div>
                        </div>
                    </div>

                    {/* Evidence List */}
                    <div className="w-full md:w-1/2 space-y-6">
                        <div>
                            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Critical Proof</h4>
                            <ul className="space-y-2">
                                {candidate.keyEvidence?.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1.5 mr-3 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-orange-400/80 uppercase tracking-widest mb-3">Vector Gaps</h4>
                            <ul className="space-y-2">
                                {candidate.risks?.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-xs text-slate-500 leading-relaxed flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500/20 mt-1.5 mr-3 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 text-[10px] text-slate-500 flex justify-between items-center uppercase tracking-widest">
                    <span>Engine v2.3</span>
                    <button onClick={() => setShowBreakdown(!showBreakdown)} className="hover:text-emerald-400 font-bold transition-colors">
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
                                <div key={key} className="bg-black/20 rounded p-4 border border-white/5 group hover:border-emerald-500/20 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">{label}</span>
                                        <span className={`text-xs font-mono font-medium ${component.percentage >= 80 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {component.percentage}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${component.percentage >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}
                                            style={{ width: `${component.percentage}%` }}
                                        ></div>
                                    </div>
                                    {component.reasoning && (
                                        <div className="text-[11px] text-slate-500 leading-relaxed mt-4 italic opacity-80 pl-4 border-l border-slate-700/50">
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
