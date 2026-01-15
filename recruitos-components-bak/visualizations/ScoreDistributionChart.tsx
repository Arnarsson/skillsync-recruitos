/* eslint-disable no-console */
import React, { useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Candidate } from '../../types';

interface ScoreDistributionChartProps {
  candidates: Candidate[];
  currentCandidateId?: string;
  height?: number;
}

interface ScoreBucket {
  range: string;
  count: number;
  hasCurrentCandidate: boolean;
  candidates: string[]; // Candidate names in this bucket
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  candidates,
  currentCandidateId,
  height = 200
}) => {
  // PATCH: Suppress Recharts defaultProps warning for XAxis/YAxis in React 18
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && /defaultProps/.test(args[0]) && /XAxis|YAxis/.test(args[0])) {
        return;
      }
      originalConsoleError(...args);
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[ScoreDistributionChart] Rendering with:', {
        candidatesCount: candidates.length,
        height,
        scores: candidates.map(c => c.alignmentScore)
      });
    }

    return () => {
      console.error = originalConsoleError;
    };
  }, [candidates, height]);

  const distributionData = useMemo(() => {
    // Define score buckets
    const buckets: ScoreBucket[] = [
      { range: '0-20', count: 0, hasCurrentCandidate: false, candidates: [] },
      { range: '21-40', count: 0, hasCurrentCandidate: false, candidates: [] },
      { range: '41-60', count: 0, hasCurrentCandidate: false, candidates: [] },
      { range: '61-80', count: 0, hasCurrentCandidate: false, candidates: [] },
      { range: '81-100', count: 0, hasCurrentCandidate: false, candidates: [] }
    ];

    // Categorize candidates into buckets
    candidates.forEach(candidate => {
      const score = candidate.alignmentScore;
      let bucketIndex = 0;

      if (score <= 20) bucketIndex = 0;
      else if (score <= 40) bucketIndex = 1;
      else if (score <= 60) bucketIndex = 2;
      else if (score <= 80) bucketIndex = 3;
      else bucketIndex = 4;

      buckets[bucketIndex].count++;
      buckets[bucketIndex].candidates.push(candidate.name);

      if (candidate.id === currentCandidateId) {
        buckets[bucketIndex].hasCurrentCandidate = true;
      }
    });

    return buckets;
  }, [candidates, currentCandidateId]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScoreBucket }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-apex-900 border border-apex-700 rounded p-3 shadow-lg">
          <p className="text-xs font-bold text-emerald-400 mb-1">Score Range: {data.range}</p>
          <p className="text-xs text-slate-300 mb-2">Candidates: {data.count}</p>
          {data.candidates.length > 0 && (
            <div className="text-xs text-slate-400 max-h-32 overflow-y-auto">
              <p className="font-semibold mb-1">In this range:</p>
              <ul className="space-y-0.5">
                {data.candidates.slice(0, 10).map((name, i) => (
                  <li key={i} className="truncate">{name}</li>
                ))}
                {data.candidates.length > 10 && (
                  <li className="italic">+{data.candidates.length - 10} more...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const maxCount = Math.max(...distributionData.map(d => d.count), 1);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            xAxisId={0}
            dataKey="range"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis
            yAxisId={0}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            domain={[0, maxCount + 1]}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {distributionData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.hasCurrentCandidate ? '#10b981' : '#475569'}
                opacity={entry.hasCurrentCandidate ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
