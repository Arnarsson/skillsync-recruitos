/**
 * NetworkGraphPanel - Visualizes candidate's professional network
 *
 * Features:
 * - Interactive network graph visualization
 * - Warm intro paths with quality indicators
 * - Shared employers/schools highlighting
 * - Industry influence metrics
 */

import React, { useMemo } from 'react';
import type { NetworkGraph, NetworkNode, WarmIntroPath } from '../../types';

interface NetworkGraphPanelProps {
  networkGraph: NetworkGraph;
  candidateName: string;
}

// Color coding for connection types
const NODE_COLORS: Record<NetworkNode['type'], string> = {
  candidate: 'bg-emerald-500',
  person: 'bg-blue-500',
  company: 'bg-purple-500',
  school: 'bg-amber-500',
  event: 'bg-pink-500',
};

const INTRO_QUALITY_COLORS: Record<WarmIntroPath['introQuality'], string> = {
  hot: 'text-red-400 bg-red-500/10 border-red-500/30',
  warm: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  cold: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

const INTRO_QUALITY_ICONS: Record<WarmIntroPath['introQuality'], string> = {
  hot: 'fa-fire',
  warm: 'fa-temperature-half',
  cold: 'fa-snowflake',
};

export const NetworkGraphPanel: React.FC<NetworkGraphPanelProps> = ({
  networkGraph,
}) => {

  // Calculate network stats
  const stats = useMemo(() => ({
    totalConnections: networkGraph.nodes.filter(n => n.type === 'person').length,
    warmIntros: networkGraph.warmIntroPaths.filter(p => p.introQuality !== 'cold').length,
    sharedCompanies: networkGraph.sharedEmployers.length,
    sharedSchools: networkGraph.sharedSchools.length,
    influenceScore: networkGraph.industryInfluence.thoughtLeadershipScore,
  }), [networkGraph]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon="fa-users"
          label="Network Size"
          value={stats.totalConnections}
          color="text-blue-400"
        />
        <StatCard
          icon="fa-handshake"
          label="Warm Intros"
          value={stats.warmIntros}
          color="text-amber-400"
        />
        <StatCard
          icon="fa-building"
          label="Shared Companies"
          value={stats.sharedCompanies}
          color="text-purple-400"
        />
        <StatCard
          icon="fa-graduation-cap"
          label="Shared Schools"
          value={stats.sharedSchools}
          color="text-amber-400"
        />
        <StatCard
          icon="fa-chart-line"
          label="Influence Score"
          value={stats.influenceScore}
          suffix="/100"
          color="text-emerald-400"
        />
      </div>

      {/* Warm Intro Paths - Most Important */}
      {networkGraph.warmIntroPaths.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
            <i className="fa-solid fa-route text-emerald-400 mr-2"></i>
            Warm Introduction Paths
          </h3>
          <div className="space-y-3">
            {networkGraph.warmIntroPaths.slice(0, 5).map((path, idx) => (
              <WarmIntroCard key={idx} path={path} />
            ))}
          </div>
        </div>
      )}

      {/* Mutual Connections */}
      {networkGraph.mutualConnections.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
            <i className="fa-solid fa-user-group text-blue-400 mr-2"></i>
            Mutual Connections ({networkGraph.mutualConnections.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {networkGraph.mutualConnections.map((conn, idx) => (
              <div
                key={idx}
                className="flex items-center bg-slate-700/50 rounded-full px-3 py-1.5"
              >
                <div className={`w-2 h-2 rounded-full ${NODE_COLORS.person} mr-2`}></div>
                <span className="text-xs text-slate-300">{conn.name}</span>
                {conn.relationship && (
                  <span className="text-xs text-slate-500 ml-2">
                    ({conn.relationship})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Background */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shared Employers */}
        {networkGraph.sharedEmployers.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
              <i className="fa-solid fa-building text-purple-400 mr-2"></i>
              Shared Employers
            </h3>
            <div className="space-y-2">
              {networkGraph.sharedEmployers.map((employer, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-700/30 rounded px-3 py-2"
                >
                  <div>
                    <span className="text-sm text-white">{employer.company}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {employer.overlap}
                    </span>
                  </div>
                  <div className="flex -space-x-1">
                    {employer.people.slice(0, 3).map((person, pIdx) => (
                      <div
                        key={pIdx}
                        className="w-6 h-6 rounded-full bg-purple-500/30 border border-purple-500/50 flex items-center justify-center"
                        title={person}
                      >
                        <span className="text-[10px] text-purple-300">
                          {person.charAt(0)}
                        </span>
                      </div>
                    ))}
                    {employer.people.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center">
                        <span className="text-[10px] text-slate-300">
                          +{employer.people.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Schools */}
        {networkGraph.sharedSchools.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
              <i className="fa-solid fa-graduation-cap text-amber-400 mr-2"></i>
              Shared Education
            </h3>
            <div className="space-y-2">
              {networkGraph.sharedSchools.map((school, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-700/30 rounded px-3 py-2"
                >
                  <div>
                    <span className="text-sm text-white">{school.school}</span>
                    {school.years !== 'Unknown' && (
                      <span className="text-xs text-slate-400 ml-2">
                        {school.years}
                      </span>
                    )}
                  </div>
                  <div className="flex -space-x-1">
                    {school.people.slice(0, 3).map((person, pIdx) => (
                      <div
                        key={pIdx}
                        className="w-6 h-6 rounded-full bg-amber-500/30 border border-amber-500/50 flex items-center justify-center"
                        title={person}
                      >
                        <span className="text-[10px] text-amber-300">
                          {person.charAt(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Industry Influence */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
          <i className="fa-solid fa-star text-yellow-400 mr-2"></i>
          Industry Influence
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {networkGraph.industryInfluence.followerCount && (
            <InfluenceMetric
              icon="fa-users"
              label="Followers"
              value={formatNumber(networkGraph.industryInfluence.followerCount)}
            />
          )}
          {networkGraph.industryInfluence.endorsementCount && (
            <InfluenceMetric
              icon="fa-thumbs-up"
              label="Endorsements"
              value={formatNumber(networkGraph.industryInfluence.endorsementCount)}
            />
          )}
          {networkGraph.industryInfluence.publicationCount && (
            <InfluenceMetric
              icon="fa-newspaper"
              label="Publications"
              value={networkGraph.industryInfluence.publicationCount}
            />
          )}
          <InfluenceMetric
            icon="fa-chart-simple"
            label="Thought Leadership"
            value={`${networkGraph.industryInfluence.thoughtLeadershipScore}/100`}
          />
        </div>

        {networkGraph.industryInfluence.communityEngagement.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <span className="text-xs text-slate-400 block mb-2">Community Engagement</span>
            <div className="flex flex-wrap gap-2">
              {networkGraph.industryInfluence.communityEngagement.map((community, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded"
                >
                  {community}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Freshness */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          <i className="fa-solid fa-clock mr-1"></i>
          Generated: {new Date(networkGraph.generatedAt).toLocaleString()}
        </span>
        <span className={`px-2 py-0.5 rounded ${networkGraph.dataFreshness === 'live' ? 'bg-emerald-500/20 text-emerald-400' :
            networkGraph.dataFreshness === 'cached' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
          }`}>
          {networkGraph.dataFreshness}
        </span>
      </div>
    </div>
  );
};

// Sub-components
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number | string;
  suffix?: string;
  color: string;
}> = ({ icon, label, value, suffix, color }) => (
  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
    <i className={`fa-solid ${icon} ${color} text-lg mb-1`}></i>
    <div className="text-lg font-bold text-white">
      {value}{suffix}
    </div>
    <div className="text-xs text-slate-400">{label}</div>
  </div>
);

const WarmIntroCard: React.FC<{ path: WarmIntroPath }> = ({ path }) => (
  <div className={`rounded-lg p-3 border ${INTRO_QUALITY_COLORS[path.introQuality]}`}>
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center">
        <i className={`fa-solid ${INTRO_QUALITY_ICONS[path.introQuality]} mr-2`}></i>
        <span className="text-sm font-medium capitalize">{path.introQuality} Intro</span>
      </div>
      <span className="text-xs opacity-70">
        {path.pathLength} hop{path.pathLength > 1 ? 's' : ''}
      </span>
    </div>
    <p className="text-sm text-slate-300 mb-2">{path.suggestedApproach}</p>
    {path.commonGround.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {path.commonGround.map((ground, idx) => (
          <span
            key={idx}
            className="text-xs bg-black/20 px-2 py-0.5 rounded"
          >
            {ground}
          </span>
        ))}
      </div>
    )}
  </div>
);

const InfluenceMetric: React.FC<{
  icon: string;
  label: string;
  value: string | number;
}> = ({ icon, label, value }) => (
  <div className="text-center">
    <i className={`fa-solid ${icon} text-slate-400 text-sm mb-1`}></i>
    <div className="text-lg font-semibold text-white">{value}</div>
    <div className="text-xs text-slate-400">{label}</div>
  </div>
);

// Utility
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default NetworkGraphPanel;
