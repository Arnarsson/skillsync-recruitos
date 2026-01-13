/**
 * AdvancedProfilePanel - Unified view of all advanced enrichment data
 *
 * Integrates:
 * - Network Graph (connections, warm intros)
 * - Behavioral Signals (GitHub, speaking, job changes)
 * - Cited Evidence (verified claims with sources)
 */

import React, { useState, useCallback } from 'react';
import type { AdvancedCandidateProfile, Candidate } from '../../types';
import { NetworkGraphPanel } from './NetworkGraphPanel';
import { BehavioralTimelinePanel } from './BehavioralTimelinePanel';
import { CitedEvidencePanel } from './CitedEvidencePanel';

interface AdvancedProfilePanelProps {
  advancedProfile: AdvancedCandidateProfile;
  candidate: Candidate;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type TabId = 'overview' | 'network' | 'behavioral' | 'cited';

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
  { id: 'network', label: 'Network', icon: 'fa-project-diagram' },
  { id: 'behavioral', label: 'Activity', icon: 'fa-wave-square' },
  { id: 'cited', label: 'Evidence', icon: 'fa-file-certificate' },
];

export const AdvancedProfilePanel: React.FC<AdvancedProfilePanelProps> = ({
  advancedProfile,
  candidate,
  onRefresh,
  isRefreshing = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  // Calculate availability of each section
  const hasNetwork = !!advancedProfile.networkGraph;
  const hasBehavioral = !!advancedProfile.behavioralSignals;
  const hasCited = !!advancedProfile.citedProfile;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <i className="fa-solid fa-brain text-emerald-400 mr-2"></i>
            <h2 className="text-sm font-semibold text-white">Advanced Intelligence</h2>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
              advancedProfile.overallConfidence >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
              advancedProfile.overallConfidence >= 40 ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {advancedProfile.overallConfidence}% confidence
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <i className={`fa-solid fa-sync ${isRefreshing ? 'fa-spin' : ''} mr-1`}></i>
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800/50">
        {TABS.map((tab) => {
          // Check if tab has data
          const hasData =
            tab.id === 'overview' ||
            (tab.id === 'network' && hasNetwork) ||
            (tab.id === 'behavioral' && hasBehavioral) ||
            (tab.id === 'cited' && hasCited);

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={!hasData}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-emerald-400'
                  : hasData
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <i className={`fa-solid ${tab.icon} mr-1.5`}></i>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
              {!hasData && tab.id !== 'overview' && (
                <span className="ml-1 text-[10px] opacity-50">(no data)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {activeTab === 'overview' && (
          <OverviewTab
            advancedProfile={advancedProfile}
            candidate={candidate}
            onViewDetails={handleTabChange}
          />
        )}

        {activeTab === 'network' && advancedProfile.networkGraph && (
          <NetworkGraphPanel
            networkGraph={advancedProfile.networkGraph}
            candidateName={candidate.name}
          />
        )}

        {activeTab === 'behavioral' && advancedProfile.behavioralSignals && (
          <BehavioralTimelinePanel
            signals={advancedProfile.behavioralSignals}
            candidateName={candidate.name}
          />
        )}

        {activeTab === 'cited' && advancedProfile.citedProfile && (
          <CitedEvidencePanel
            citedProfile={advancedProfile.citedProfile}
            candidateName={candidate.name}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span>
          <i className="fa-solid fa-clock mr-1"></i>
          Last updated: {new Date(advancedProfile.lastUpdated).toLocaleString()}
        </span>
        <span>
          Next refresh: {new Date(advancedProfile.nextRefreshRecommended).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  advancedProfile: AdvancedCandidateProfile;
  candidate: Candidate;
  onViewDetails: (tab: TabId) => void;
}> = ({ advancedProfile, candidate, onViewDetails }) => {
  const { dataCompleteness } = advancedProfile;

  return (
    <div className="space-y-6">
      {/* Approach Readiness - Most Important */}
      {advancedProfile.behavioralSignals && (
        <div className={`rounded-lg p-4 border ${
          advancedProfile.behavioralSignals.approachReadiness === 'ready'
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : advancedProfile.behavioralSignals.approachReadiness === 'not_ready'
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className={`fa-solid ${
                advancedProfile.behavioralSignals.approachReadiness === 'ready'
                  ? 'fa-check-circle text-emerald-400'
                  : advancedProfile.behavioralSignals.approachReadiness === 'not_ready'
                  ? 'fa-times-circle text-red-400'
                  : 'fa-minus-circle text-amber-400'
              } text-2xl mr-3`}></i>
              <div>
                <div className="text-sm font-semibold text-white capitalize">
                  {advancedProfile.behavioralSignals.approachReadiness.replace('_', ' ')} Approach Readiness
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {advancedProfile.behavioralSignals.bestTimeToReach}
                </div>
              </div>
            </div>
            {advancedProfile.behavioralSignals.openToWorkSignal && (
              <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                OPEN TO WORK
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Completeness */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
          <i className="fa-solid fa-database text-blue-400 mr-2"></i>
          Data Completeness
        </h3>
        <div className="space-y-3">
          <CompletenessBar
            label="Network Analysis"
            value={dataCompleteness.network}
            icon="fa-project-diagram"
            onClick={() => dataCompleteness.network > 0 && onViewDetails('network')}
          />
          <CompletenessBar
            label="Behavioral Signals"
            value={dataCompleteness.behavioral}
            icon="fa-wave-square"
            onClick={() => dataCompleteness.behavioral > 0 && onViewDetails('behavioral')}
          />
          <CompletenessBar
            label="Cited Evidence"
            value={dataCompleteness.cited}
            icon="fa-file-certificate"
            onClick={() => dataCompleteness.cited > 0 && onViewDetails('cited')}
          />
        </div>
      </div>

      {/* Key Insights Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Network Highlights */}
        {advancedProfile.networkGraph && (
          <InsightCard
            title="Network"
            icon="fa-project-diagram"
            color="text-purple-400"
            onClick={() => onViewDetails('network')}
          >
            <div className="space-y-2">
              <InsightRow
                label="Warm Intros"
                value={advancedProfile.networkGraph.warmIntroPaths.filter(p => p.introQuality !== 'cold').length}
              />
              <InsightRow
                label="Shared Companies"
                value={advancedProfile.networkGraph.sharedEmployers.length}
              />
              <InsightRow
                label="Influence Score"
                value={`${advancedProfile.networkGraph.industryInfluence.thoughtLeadershipScore}/100`}
              />
            </div>
          </InsightCard>
        )}

        {/* Behavioral Highlights */}
        {advancedProfile.behavioralSignals && (
          <InsightCard
            title="Activity"
            icon="fa-wave-square"
            color="text-blue-400"
            onClick={() => onViewDetails('behavioral')}
          >
            <div className="space-y-2">
              {advancedProfile.behavioralSignals.github && (
                <InsightRow
                  label="GitHub Streak"
                  value={`${advancedProfile.behavioralSignals.github.contributionStreak} days`}
                />
              )}
              <InsightRow
                label="Speaking Events"
                value={advancedProfile.behavioralSignals.speakingEngagements.length}
              />
              <InsightRow
                label="Engagement"
                value={advancedProfile.behavioralSignals.engagementRecency}
              />
            </div>
          </InsightCard>
        )}

        {/* Evidence Highlights */}
        {advancedProfile.citedProfile && (
          <InsightCard
            title="Evidence"
            icon="fa-file-certificate"
            color="text-emerald-400"
            onClick={() => onViewDetails('cited')}
          >
            <div className="space-y-2">
              <InsightRow
                label="Data Quality"
                value={`${advancedProfile.citedProfile.dataQualityScore}%`}
              />
              <InsightRow
                label="Sources Used"
                value={advancedProfile.citedProfile.sourcesUsed.length}
              />
              <InsightRow
                label="Verified Skills"
                value={advancedProfile.citedProfile.skills.filter(s =>
                  s.evidence.some(e => e.verificationStatus === 'verified')
                ).length}
              />
            </div>
          </InsightCard>
        )}

        {/* Quick Actions */}
        <InsightCard
          title="Quick Actions"
          icon="fa-bolt"
          color="text-amber-400"
        >
          <div className="space-y-2">
            {advancedProfile.networkGraph?.warmIntroPaths[0] && (
              <QuickAction
                icon="fa-handshake"
                label="Best intro path"
                detail={advancedProfile.networkGraph.warmIntroPaths[0].suggestedApproach.slice(0, 50) + '...'}
              />
            )}
            {advancedProfile.behavioralSignals?.github && (
              <QuickAction
                icon="fa-brands fa-github"
                label="View GitHub"
                detail={`@${advancedProfile.behavioralSignals.github.username}`}
                href={advancedProfile.behavioralSignals.github.profileUrl}
              />
            )}
          </div>
        </InsightCard>
      </div>
    </div>
  );
};

// Sub-components
const CompletenessBar: React.FC<{
  label: string;
  value: number;
  icon: string;
  onClick?: () => void;
}> = ({ label, value, icon, onClick }) => (
  <div
    className={`${onClick && value > 0 ? 'cursor-pointer hover:bg-slate-700/30' : ''} rounded p-2 transition-colors`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center text-xs text-slate-300">
        <i className={`fa-solid ${icon} mr-2 text-slate-400`}></i>
        {label}
      </div>
      <span className={`text-xs ${
        value >= 70 ? 'text-emerald-400' :
        value >= 40 ? 'text-amber-400' :
        value > 0 ? 'text-red-400' :
        'text-slate-500'
      }`}>
        {value}%
      </span>
    </div>
    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${
          value >= 70 ? 'bg-emerald-500' :
          value >= 40 ? 'bg-amber-500' :
          value > 0 ? 'bg-red-500' :
          'bg-slate-600'
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const InsightCard: React.FC<{
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ title, icon, color, children, onClick }) => (
  <div
    className={`bg-slate-800/50 rounded-lg p-4 border border-slate-700 ${
      onClick ? 'cursor-pointer hover:bg-slate-700/30 transition-colors' : ''
    }`}
    onClick={onClick}
  >
    <h4 className={`text-xs font-semibold ${color} mb-3 flex items-center`}>
      <i className={`fa-solid ${icon} mr-2`}></i>
      {title}
      {onClick && <i className="fa-solid fa-arrow-right ml-auto text-slate-500 text-[10px]"></i>}
    </h4>
    {children}
  </div>
);

const InsightRow: React.FC<{
  label: string;
  value: string | number;
}> = ({ label, value }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-slate-400">{label}</span>
    <span className="text-white font-medium">{value}</span>
  </div>
);

const QuickAction: React.FC<{
  icon: string;
  label: string;
  detail: string;
  href?: string;
}> = ({ icon, label, detail, href }) => {
  const content = (
    <div className="flex items-start">
      <i className={`${icon} text-slate-400 mr-2 mt-0.5`}></i>
      <div>
        <div className="text-xs text-white">{label}</div>
        <div className="text-[10px] text-slate-400 truncate">{detail}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-slate-700/30 rounded p-1 -m-1 transition-colors"
      >
        {content}
      </a>
    );
  }

  return <div className="p-1 -m-1">{content}</div>;
};

export default AdvancedProfilePanel;
