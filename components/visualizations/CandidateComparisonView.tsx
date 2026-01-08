import React, { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Candidate } from '@/types';

interface CandidateComparisonViewProps {
  candidates: Candidate[];
  onClose: () => void;
}

/**
 * Side-by-side comparison view for 2-3 candidates
 * Shows radar charts, difference tables, and key metric comparisons
 */
export const CandidateComparisonView: React.FC<CandidateComparisonViewProps> = ({ candidates, onClose }) => {
  // Prepare radar chart data for each candidate
  const radarData = useMemo(() => {
    if (candidates.length === 0) return [];

    const categories = ['Skills', 'Exp.', 'Industry', 'Seniority', 'Location'];

    return categories.map((category, idx) => {
      const dataPoint: Record<string, string | number> = { subject: category };

      candidates.forEach((candidate, cIdx) => {
        const scoreKey = ['skills', 'experience', 'industry', 'seniority', 'location'][idx];
        const score = candidate.scoreBreakdown?.[scoreKey as keyof typeof candidate.scoreBreakdown]?.percentage || 0;
        dataPoint[`candidate${cIdx}`] = score;
      });

      return dataPoint;
    });
  }, [candidates]);

  // Calculate differences
  const metricComparisons = useMemo(() => {
    if (candidates.length < 2) return [];

    const metrics = [
      { key: 'skills', label: 'Skills', icon: 'fa-code' },
      { key: 'experience', label: 'Experience', icon: 'fa-briefcase' },
      { key: 'industry', label: 'Industry', icon: 'fa-building' },
      { key: 'seniority', label: 'Seniority', icon: 'fa-star' },
      { key: 'location', label: 'Location', icon: 'fa-location-dot' }
    ];

    return metrics.map(metric => {
      const scores = candidates.map(c =>
        c.scoreBreakdown?.[metric.key as keyof typeof c.scoreBreakdown]?.percentage || 0
      );

      const maxScore = Math.max(...scores);
      const maxIndex = scores.indexOf(maxScore);

      return {
        ...metric,
        scores,
        leader: maxIndex,
        maxScore
      };
    });
  }, [candidates]);

  // Key differences analysis
  const keyDifferences = useMemo(() => {
    if (candidates.length < 2) return [];

    const differences: string[] = [];

    // Compare scores
    const scoreDiff = Math.abs(candidates[0].alignmentScore - candidates[1].alignmentScore);
    if (scoreDiff > 20) {
      differences.push(`${candidates[0].alignmentScore > candidates[1].alignmentScore ? candidates[0].name : candidates[1].name} has significantly higher overall fit (${Math.round(scoreDiff)}% difference)`);
    }

    // Compare experience
    if (candidates[0].yearsExperience && candidates[1].yearsExperience) {
      const expDiff = Math.abs(candidates[0].yearsExperience - candidates[1].yearsExperience);
      if (expDiff >= 3) {
        differences.push(`${candidates[0].yearsExperience > candidates[1].yearsExperience ? candidates[0].name : candidates[1].name} has ${expDiff} more years of experience`);
      }
    }

    // Compare locations
    if (candidates[0].location !== candidates[1].location) {
      differences.push(`Location difference: ${candidates[0].name} (${candidates[0].location}) vs ${candidates[1].name} (${candidates[1].location})`);
    }

    // Compare personas
    if (candidates[0].persona && candidates[1].persona) {
      if (candidates[0].persona.archetype !== candidates[1].persona.archetype) {
        differences.push(`Different work styles: ${candidates[0].name} is ${candidates[0].persona.archetype}, ${candidates[1].name} is ${candidates[1].persona.archetype}`);
      }
    }

    return differences;
  }, [candidates]);

  const candidateColors = ['#10b981', '#3b82f6', '#f59e0b']; // green, blue, amber

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-apex-900 border border-apex-700 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-apex-800 border-b border-apex-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <i className="fa-solid fa-code-compare text-blue-500 mr-3"></i>
              Candidate Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-1">Side-by-side analysis of {candidates.length} candidates</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-2"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Candidate Overview Cards */}
          <div className={`grid ${candidates.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
            {candidates.map((candidate, idx) => (
              <div
                key={candidate.id}
                className="bg-apex-800/50 border-2 rounded-lg p-4"
                style={{ borderColor: candidateColors[idx] }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={candidate.avatar}
                    alt={candidate.name}
                    className="w-12 h-12 rounded-full border-2"
                    style={{ borderColor: candidateColors[idx] }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{candidate.name}</h3>
                    <p className="text-xs text-slate-400">{candidate.currentRole || 'Role Not Listed'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Fit Score</span>
                    <span
                      className="font-bold font-mono text-lg"
                      style={{ color: candidateColors[idx] }}
                    >
                      {candidate.alignmentScore}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Experience</span>
                    <span className="text-slate-300">{candidate.yearsExperience}y</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Location</span>
                    <span className="text-slate-300">{candidate.location}</span>
                  </div>
                  {candidate.persona && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Archetype</span>
                      <span className="text-purple-400 text-[10px] font-bold uppercase">{candidate.persona.archetype}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Radar Charts Side-by-Side */}
          <div className="bg-apex-800/30 border border-apex-700 rounded-lg p-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
              <i className="fa-solid fa-chart-radar text-blue-500 mr-2"></i>
              Skills Profile Comparison
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                  {candidates.map((candidate, idx) => (
                    <Radar
                      key={candidate.id}
                      name={candidate.name}
                      dataKey={`candidate${idx}`}
                      stroke={candidateColors[idx]}
                      fill={candidateColors[idx]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}

                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', color: '#fff' }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              {candidates.map((candidate, idx) => (
                <div key={candidate.id} className="flex items-center">
                  <div
                    className="w-4 h-0.5 mr-2"
                    style={{ backgroundColor: candidateColors[idx] }}
                  ></div>
                  <span className="text-xs text-slate-400">{candidate.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div className="bg-apex-800/30 border border-apex-700 rounded-lg overflow-hidden">
            <div className="bg-apex-800/50 px-6 py-3 border-b border-apex-700">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                <i className="fa-solid fa-table text-emerald-500 mr-2"></i>
                Detailed Comparison
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-apex-800/30">
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Metric
                    </th>
                    {candidates.map((candidate, idx) => (
                      <th
                        key={candidate.id}
                        className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider"
                        style={{ color: candidateColors[idx] }}
                      >
                        {candidate.name}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Leader
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apex-700">
                  {metricComparisons.map((metric) => (
                    <tr key={metric.key} className="hover:bg-apex-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <i className={`fa-solid ${metric.icon} text-slate-500 text-xs`}></i>
                          <span className="text-sm text-slate-300 font-medium">{metric.label}</span>
                        </div>
                      </td>
                      {metric.scores.map((score, idx) => (
                        <td key={idx} className="px-6 py-4 text-center">
                          <span
                            className={`text-sm font-bold font-mono ${
                              idx === metric.leader ? 'text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            {score}%
                          </span>
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-emerald-400">
                          {candidates[metric.leader].name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Differences */}
          {keyDifferences.length > 0 && (
            <div className="bg-apex-800/30 border border-apex-700 rounded-lg p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
                <i className="fa-solid fa-lightbulb text-yellow-500 mr-2"></i>
                Key Differences
              </h3>
              <ul className="space-y-2">
                {keyDifferences.map((diff, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-300">
                    <i className="fa-solid fa-circle text-blue-500 text-[6px] mt-2 mr-3"></i>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
