import React from 'react';
import { Persona } from '../../types';
import { getArchetypeIcon, getArchetypeInfo } from '../../utils/archetypes';

interface PersonaIntelligencePanelProps {
  persona: Persona;
}

export const PersonaIntelligencePanel: React.FC<PersonaIntelligencePanelProps> = ({ persona }) => {
  if (!persona) return null;
  const { careerTrajectory, skillProfile, riskAssessment, compensationIntelligence } = persona;

  // Data quality detection - check if we have meaningful career data
  const hasCareerData = careerTrajectory &&
    careerTrajectory.averageTenure &&
    careerTrajectory.averageTenure.length > 0 &&
    !careerTrajectory.averageTenure.toLowerCase().includes('unknown');

  const hasSkillData = skillProfile?.coreSkills && skillProfile.coreSkills.length > 0;

  const hasCompensationData = compensationIntelligence &&
    compensationIntelligence.likelySalaryExpectation > 0 &&
    compensationIntelligence.impliedSalaryBand.min > 0;

  // If we have no meaningful data at all, show helpful empty state
  const hasNoData = !hasCareerData && !hasSkillData && !hasCompensationData;

  // Helper function to get velocity icon
  const getVelocityIcon = (velocity: string) => {
    switch (velocity) {
      case 'rapid': return '';
      case 'steady': return '';
      case 'slow': return '';
      default: return '';
    }
  };

  // Helper function to get risk color
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-400';
      case 'moderate': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const archetypeInfo = getArchetypeInfo(persona.archetype);

  return (
    <div className="space-y-10 p-2">
      {/* Enhanced Archetype Header */}
      <div className="border-b border-slate-900 pb-10">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-100 mb-2 tracking-tight">{persona.archetype}</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4 max-w-2xl">
              {persona.reasoning}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-slate-800 rounded-full bg-slate-900/40">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Professional Intelligence Vector</span>
            </div>
          </div>
        </div>

        {/* Psychometric Profile Quick View */}
        {persona.psychometric && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <div className="bg-slate-900/20 rounded p-3 border border-slate-900/50">
              <div className="text-[10px] text-slate-600 uppercase mb-2 tracking-widest font-bold">
                Communication
              </div>
              <div className="text-xs font-medium text-slate-300">{persona.psychometric.communicationStyle}</div>
            </div>
            <div className="bg-slate-900/20 rounded p-3 border border-slate-900/50">
              <div className="text-[10px] text-slate-600 uppercase mb-2 tracking-widest font-bold">
                Motivator
              </div>
              <div className="text-xs font-medium text-slate-300">{persona.psychometric.primaryMotivator}</div>
            </div>
            <div className="bg-slate-900/20 rounded p-3 border border-slate-900/50">
              <div className="text-[10px] text-slate-600 uppercase mb-2 tracking-widest font-bold">
                Risk Tolerance
              </div>
              <div className="text-xs font-medium text-slate-300">{persona.psychometric.riskTolerance}</div>
            </div>
            <div className="bg-slate-900/20 rounded p-3 border border-slate-900/50">
              <div className="text-[10px] text-slate-600 uppercase mb-2 tracking-widest font-bold">
                Leadership
              </div>
              <div className="text-xs font-medium text-slate-300">{persona.psychometric.leadershipPotential}</div>
            </div>
          </div>
        )}

        {/* Green/Red Flags Side by Side */}
        {(persona.greenFlags?.length > 0 || persona.redFlags?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Green Flags */}
            {persona.greenFlags && persona.greenFlags.length > 0 && (
              <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fa-solid fa-circle-check text-emerald-400"></i>
                  <h5 className="text-xs font-bold text-emerald-400 uppercase">Strengths</h5>
                </div>
                <ul className="space-y-2">
                  {persona.greenFlags.slice(0, 3).map((flag, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start">
                      <i className="fa-solid fa-plus text-emerald-500 mt-0.5 mr-2 text-xs flex-shrink-0"></i>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flags */}
            {persona.redFlags && persona.redFlags.length > 0 && (
              <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
                  <h5 className="text-xs font-bold text-red-400 uppercase">Considerations</h5>
                </div>
                <ul className="space-y-2">
                  {persona.redFlags.slice(0, 3).map((flag, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start">
                      <i className="fa-solid fa-minus text-red-500 mt-0.5 mr-2 text-xs flex-shrink-0"></i>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helpful Empty State - Show when data quality is very low */}
      {hasNoData && (
        <div className="bg-yellow-900/10 border border-yellow-500/30 rounded-lg p-6 text-center">
          <i className="fa-solid fa-circle-info text-yellow-500 text-3xl mb-4"></i>
          <h3 className="text-sm font-bold text-yellow-400 mb-3">Limited Professional Data Available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-4">
            This candidate&apos;s profile has minimal work experience or career history data.
            This commonly occurs with:
          </p>
          <ul className="text-xs text-slate-400 space-y-2 text-left max-w-sm mx-auto mb-4">
            <li className="flex items-start">
              <i className="fa-solid fa-chevron-right text-yellow-500 text-[10px] mr-2 mt-1"></i>
              <span>Privacy-restricted LinkedIn profiles</span>
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-chevron-right text-yellow-500 text-[10px] mr-2 mt-1"></i>
              <span>Early-career professionals with limited history</span>
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-chevron-right text-yellow-500 text-[10px] mr-2 mt-1"></i>
              <span>Incomplete or sparse public profiles</span>
            </li>
          </ul>
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 text-xs text-blue-300">
            <i className="fa-solid fa-lightbulb mr-2 text-blue-400"></i>
            <strong>Recommendation:</strong> Use the interview process to gather career trajectory,
            skill depth, and compensation expectations directly from the candidate.
          </div>
        </div>
      )}

      {/* Career Trajectory */}
      {!hasNoData && careerTrajectory && hasCareerData && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-chart-line text-emerald-500 text-sm"></i>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Career Trajectory</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-apex-800/50 rounded p-3 border border-apex-700/50">
              <div className="text-xs text-slate-500 uppercase mb-1">Growth Velocity</div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getVelocityIcon(careerTrajectory.growthVelocity)}</span>
                <span className="text-sm font-bold text-white capitalize">{careerTrajectory.growthVelocity}</span>
              </div>
            </div>

            <div className="bg-apex-800/50 rounded p-3 border border-apex-700/50">
              <div className="text-xs text-slate-500 uppercase mb-1">Promotion Frequency</div>
              <div className="text-sm font-bold text-white capitalize">{careerTrajectory.promotionFrequency}</div>
            </div>

            <div className="bg-apex-800/50 rounded p-3 border border-apex-700/50">
              <div className="text-xs text-slate-500 uppercase mb-1">Role Progression</div>
              <div className="text-sm font-bold text-white capitalize">{careerTrajectory.roleProgression}</div>
            </div>

            <div className="bg-apex-800/50 rounded p-3 border border-apex-700/50">
              <div className="text-xs text-slate-500 uppercase mb-1">Average Tenure</div>
              <div className="text-sm font-bold text-white">{careerTrajectory.averageTenure}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-apex-800/30 rounded p-2">
            <span>Leadership Growth: <span className="font-bold text-white capitalize">{careerTrajectory.leadershipGrowth}</span></span>
            <span>Tenure Pattern: <span className="font-bold text-white capitalize">{careerTrajectory.tenurePattern}</span></span>
            <span>Industry Pivots: <span className="font-bold text-white">{careerTrajectory.industryPivots}</span></span>
          </div>
        </div>
      )}

      {/* Skill Profile */}
      {!hasNoData && skillProfile && hasSkillData && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-code text-blue-500 text-sm"></i>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Skill Profile</h4>
          </div>

          {/* Depth vs Breadth Badge */}
          <div className="inline-block">
            <span className="px-3 py-1 bg-blue-900/20 border border-blue-500/30 rounded-full text-xs font-bold text-blue-400 capitalize">
              {skillProfile.depthVsBreadth}
            </span>
          </div>

          {/* Core Skills with Proficiency */}
          {skillProfile.coreSkills && skillProfile.coreSkills.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Core Skills</div>
              <div className="space-y-2">
                {skillProfile.coreSkills.map((skill, i) => {
                  const proficiencyPercent = skill.proficiency === 'expert' ? 100 : skill.proficiency === 'advanced' ? 80 : 60;
                  const proficiencyColor = skill.proficiency === 'expert' ? 'bg-emerald-500' : skill.proficiency === 'advanced' ? 'bg-blue-500' : 'bg-yellow-500';

                  return (
                    <div key={i} className="bg-apex-800/30 rounded p-2 border border-apex-700/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-300">{skill.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500">{skill.yearsActive} years</span>
                          <span className={`text-xs font-bold capitalize ${skill.proficiency === 'expert' ? 'text-emerald-400' :
                            skill.proficiency === 'advanced' ? 'text-blue-400' :
                              'text-yellow-400'
                            }`}>{skill.proficiency}</span>
                        </div>
                      </div>
                      <div className="w-full bg-apex-900 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${proficiencyColor}`}
                          style={{ width: `${proficiencyPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emerging, Deprecated, Gaps, Adjacent Skills */}
          <div className="grid grid-cols-2 gap-3">
            {skillProfile.emergingSkills && skillProfile.emergingSkills.length > 0 && (
              <div className="bg-apex-800/30 rounded p-3 border border-apex-700/50">
                <div className="flex items-center space-x-1.5 mb-2">
                  <i className="fa-solid fa-seedling text-green-400 text-xs"></i>
                  <div className="text-xs font-bold text-green-400 uppercase">Emerging</div>
                </div>
                <div className="space-y-1">
                  {skillProfile.emergingSkills.map((skill, i) => (
                    <div key={i} className="text-[11px] text-slate-300">{skill}</div>
                  ))}
                </div>
              </div>
            )}

            {skillProfile.skillGaps && skillProfile.skillGaps.length > 0 && (
              <div className="bg-apex-800/30 rounded p-3 border border-apex-700/50">
                <div className="flex items-center space-x-1.5 mb-2">
                  <i className="fa-solid fa-exclamation-triangle text-yellow-400 text-xs"></i>
                  <div className="text-xs font-bold text-yellow-400 uppercase">Gaps</div>
                </div>
                <div className="space-y-1">
                  {skillProfile.skillGaps.map((skill, i) => (
                    <div key={i} className="text-[11px] text-slate-300">{skill}</div>
                  ))}
                </div>
              </div>
            )}

            {skillProfile.deprecatedSkills && skillProfile.deprecatedSkills.length > 0 && (
              <div className="bg-apex-800/30 rounded p-3 border border-apex-700/50">
                <div className="flex items-center space-x-1.5 mb-2">
                  <i className="fa-solid fa-box-archive text-slate-500 text-xs"></i>
                  <div className="text-xs font-bold text-slate-400 uppercase">Deprecated</div>
                </div>
                <div className="space-y-1">
                  {skillProfile.deprecatedSkills.map((skill, i) => (
                    <div key={i} className="text-[11px] text-slate-400">{skill}</div>
                  ))}
                </div>
              </div>
            )}

            {skillProfile.adjacentSkills && skillProfile.adjacentSkills.length > 0 && (
              <div className="bg-apex-800/30 rounded p-3 border border-apex-700/50">
                <div className="flex items-center space-x-1.5 mb-2">
                  <i className="fa-solid fa-arrows-left-right text-purple-400 text-xs"></i>
                  <div className="text-xs font-bold text-purple-400 uppercase">Adjacent</div>
                </div>
                <div className="space-y-1">
                  {skillProfile.adjacentSkills.map((skill, i) => (
                    <div key={i} className="text-[11px] text-slate-300">{skill}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {!hasNoData && riskAssessment && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-shield-halved text-orange-500 text-sm"></i>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Risk Assessment</h4>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-apex-800/50 rounded p-3 border border-apex-700/50 text-center">
              <div className="text-xs text-slate-500 uppercase mb-1">Attrition Risk</div>
              <div className={`text-sm font-bold capitalize ${getRiskColor(riskAssessment.attritionRisk)}`}>
                {riskAssessment.attritionRisk}
              </div>
            </div>

            <div className="bg-apex-800/50 rounded p-3 border border-apex-700/50 text-center">
              <div className="text-xs text-slate-500 uppercase mb-1">Skill Obsolescence</div>
              <div className={`text-sm font-bold capitalize ${getRiskColor(riskAssessment.skillObsolescenceRisk)}`}>
                {riskAssessment.skillObsolescenceRisk}
              </div>
            </div>

            <div className="bg-apex-800/50 rounded p-3 border border-apex-700/50 text-center">
              <div className="text-xs text-slate-500 uppercase mb-1">Compensation Risk</div>
              <div className={`text-sm font-bold capitalize ${getRiskColor(riskAssessment.compensationRiskLevel)}`}>
                {riskAssessment.compensationRiskLevel}
              </div>
            </div>
          </div>

          {riskAssessment.flightRiskFactors && riskAssessment.flightRiskFactors.length > 0 && (
            <div className="bg-apex-800/30 rounded p-3 border border-apex-700/50">
              <div className="text-xs font-bold text-orange-400 uppercase mb-2">Flight Risk Factors</div>
              <ul className="space-y-1.5">
                {riskAssessment.flightRiskFactors.map((factor, i) => (
                  <li key={i} className="text-[11px] text-slate-300 flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {riskAssessment.geographicBarriers && riskAssessment.geographicBarriers.length > 0 && (
            <div className="bg-apex-800/30 rounded p-3 border border-apex-700/50">
              <div className="text-xs font-bold text-yellow-400 uppercase mb-2">Geographic Barriers</div>
              <ul className="space-y-1.5">
                {riskAssessment.geographicBarriers.map((barrier, i) => (
                  <li key={i} className="text-[11px] text-slate-300 flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    <span>{barrier}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {riskAssessment.unexplainedGaps && (
            <div className="flex items-center space-x-2 text-[11px] text-red-400 bg-red-900/10 border border-red-500/20 rounded p-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span className="font-semibold">Resume contains unexplained gaps (&gt;6 months)</span>
            </div>
          )}
        </div>
      )}

      {/* Compensation Intelligence */}
      {!hasNoData && compensationIntelligence && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-sack-dollar text-yellow-500 text-sm"></i>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Compensation Intelligence</h4>
          </div>

          {hasCompensationData ? (
            <div className="bg-gradient-to-br from-yellow-900/10 to-orange-900/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="text-center mb-3">
                <div className="text-xs text-yellow-400 uppercase font-bold mb-1">Implied Salary Band</div>
                <div className="text-2xl font-bold text-white">
                  {compensationIntelligence.impliedSalaryBand.min.toLocaleString()} - {compensationIntelligence.impliedSalaryBand.max.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">{compensationIntelligence.impliedSalaryBand.currency}</div>
              </div>

              <div className="border-t border-yellow-500/20 pt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">Expected</div>
                  <div className="text-sm font-bold text-yellow-400">
                    {compensationIntelligence.likelySalaryExpectation.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">Growth Rate</div>
                  <div className="text-sm font-bold text-white capitalize">
                    {compensationIntelligence.compensationGrowthRate}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">Equity</div>
                  <div className="text-sm font-bold">
                    {compensationIntelligence.equityIndicators ? (
                      <span className="text-emerald-400">Expected</span>
                    ) : (
                      <span className="text-slate-500">Not Expected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-apex-800/30 border border-apex-700 rounded-lg p-6 text-center">
              <i className="fa-solid fa-chart-simple text-slate-600 text-2xl mb-3"></i>
              <div className="text-xs font-bold text-slate-400 mb-2">Compensation Data Unavailable</div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Unable to estimate salary range from available profile data.
                Discuss compensation expectations during the interview process.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Basic Persona Info (fallback if enhanced data not available) */}
      {!careerTrajectory && !skillProfile && !riskAssessment && !compensationIntelligence && (
        <div className="text-center text-slate-500 text-sm py-6">
          <i className="fa-solid fa-circle-info mb-2"></i>
          <p>Enhanced persona data not available for this candidate.</p>
          <p className="text-xs mt-1">Re-analyze to generate comprehensive intelligence.</p>
        </div>
      )}
    </div>
  );
};
