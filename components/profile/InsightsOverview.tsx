import React from 'react';
import { Candidate } from '../../types';
import { formatSalaryBand, getRiskLevelColor } from '../../utils/archetypes';

interface InsightsOverviewProps {
    candidate: Candidate;
}

export const InsightsOverview: React.FC<InsightsOverviewProps> = ({ candidate }) => {
    if (!candidate.persona) return null;

    return (
        <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Career Velocity */}
                <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-lg">
                    <div className="mb-4">
                        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Career Velocity</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Growth:</span>
                            <span className="font-medium text-slate-300">
                                {candidate.persona.careerTrajectory?.growthVelocity === 'rapid' ? 'Rapid' :
                                    candidate.persona.careerTrajectory?.growthVelocity === 'steady' ? 'Steady' :
                                        candidate.persona.careerTrajectory?.growthVelocity === 'slow' ? 'Slow' : 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Promotions:</span>
                            <span className="font-medium text-slate-300">
                                {candidate.persona.careerTrajectory?.promotionFrequency === 'high' ? 'Frequent' :
                                    candidate.persona.careerTrajectory?.promotionFrequency === 'moderate' ? 'Moderate' :
                                        candidate.persona.careerTrajectory?.promotionFrequency === 'low' ? 'Rare' : 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between text-[11px] pt-1 border-t border-slate-900/50">
                            <span className="text-slate-600">Pattern:</span>
                            <span className="text-slate-400 capitalize">
                                {candidate.persona.careerTrajectory?.roleProgression || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Skill Profile */}
                <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-lg">
                    <div className="mb-4">
                        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Skill Profile</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Depth:</span>
                            <span className="font-medium text-slate-300 capitalize">
                                {candidate.persona.skillProfile?.depthVsBreadth || 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Core Skills:</span>
                            <span className="font-medium text-slate-300">
                                {candidate.persona.skillProfile?.coreSkills?.length || 0} expert
                            </span>
                        </div>
                        <div className="flex justify-between text-[11px] pt-1 border-t border-slate-900/50">
                            <span className="text-slate-600">Gaps:</span>
                            <span className={`text-slate-400 ${(candidate.persona.skillProfile?.skillGaps?.length || 0) > 0 ? 'text-amber-500/50' : ''}`}>
                                {candidate.persona.skillProfile?.skillGaps?.length || 0} identified
                            </span>
                        </div>
                    </div>
                </div>

                {/* Retention Risk */}
                <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-lg">
                    <div className="mb-4">
                        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Retention Risk</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Attrition:</span>
                            <span className={`font-medium uppercase text-xs ${getRiskLevelColor(candidate.persona.riskAssessment?.attritionRisk)} opacity-70`}>
                                {candidate.persona.riskAssessment?.attritionRisk || 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Flight Risk:</span>
                            <span className="font-medium text-slate-300">
                                {candidate.persona.riskAssessment?.flightRiskFactors?.length || 0} factors
                            </span>
                        </div>
                        <div className="flex justify-between text-[11px] pt-1 border-t border-slate-900/50">
                            <span className="text-slate-600">Tenure:</span>
                            <span className="text-slate-400 capitalize">
                                {candidate.persona.careerTrajectory?.tenurePattern || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Compensation */}
                <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-lg">
                    <div className="mb-4">
                        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Compensation</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Band:</span>
                            <span className="font-medium text-slate-300">
                                {formatSalaryBand(candidate.persona.compensationIntelligence?.impliedSalaryBand)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Growth:</span>
                            <span className="font-medium text-slate-300 capitalize text-[11px]">
                                {candidate.persona.compensationIntelligence?.compensationGrowthRate || 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between text-[11px] pt-1 border-t border-slate-900/50">
                            <span className="text-slate-600">Risk:</span>
                            <span className={`uppercase ${getRiskLevelColor(candidate.persona.riskAssessment?.compensationRiskLevel)} opacity-70`}>
                                {candidate.persona.riskAssessment?.compensationRiskLevel || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
