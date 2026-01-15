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
                <div className="bg-slate-800/30 border border-white/[0.08] p-4 rounded-lg">
                    <div className="mb-3">
                        <h3 className="text-xs font-medium text-slate-400">Career Velocity</h3>
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
                        <div className="flex justify-between text-xs pt-2 border-t border-white/[0.05]">
                            <span className="text-slate-500">Pattern:</span>
                            <span className="text-slate-400 capitalize">
                                {candidate.persona.careerTrajectory?.roleProgression || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Skill Profile */}
                <div className="bg-slate-800/30 border border-white/[0.08] p-4 rounded-lg">
                    <div className="mb-3">
                        <h3 className="text-xs font-medium text-slate-400">Skill Profile</h3>
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
                        <div className="flex justify-between text-xs pt-2 border-t border-white/[0.05]">
                            <span className="text-slate-500">Gaps:</span>
                            <span className={`text-slate-400 ${(candidate.persona.skillProfile?.skillGaps?.length || 0) > 0 ? 'text-amber-400' : ''}`}>
                                {candidate.persona.skillProfile?.skillGaps?.length || 0} identified
                            </span>
                        </div>
                    </div>
                </div>

                {/* Retention Risk */}
                <div className="bg-slate-800/30 border border-white/[0.08] p-4 rounded-lg">
                    <div className="mb-3">
                        <h3 className="text-xs font-medium text-slate-400">Retention Risk</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Attrition:</span>
                            <span className={`font-medium capitalize ${getRiskLevelColor(candidate.persona.riskAssessment?.attritionRisk)}`}>
                                {candidate.persona.riskAssessment?.attritionRisk || 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Flight Risk:</span>
                            <span className="font-medium text-slate-300">
                                {candidate.persona.riskAssessment?.flightRiskFactors?.length || 0} factors
                            </span>
                        </div>
                        <div className="flex justify-between text-xs pt-2 border-t border-white/[0.05]">
                            <span className="text-slate-500">Tenure:</span>
                            <span className="text-slate-400 capitalize">
                                {candidate.persona.careerTrajectory?.tenurePattern || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Compensation */}
                <div className="bg-slate-800/30 border border-white/[0.08] p-4 rounded-lg">
                    <div className="mb-3">
                        <h3 className="text-xs font-medium text-slate-400">Compensation</h3>
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
                            <span className="font-medium text-slate-300 capitalize">
                                {candidate.persona.compensationIntelligence?.compensationGrowthRate || 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs pt-2 border-t border-white/[0.05]">
                            <span className="text-slate-500">Risk:</span>
                            <span className={`capitalize ${getRiskLevelColor(candidate.persona.riskAssessment?.compensationRiskLevel)}`}>
                                {candidate.persona.riskAssessment?.compensationRiskLevel || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
