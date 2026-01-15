/**
 * BehavioralTimelinePanel - Displays candidate's recent activity signals
 *
 * Features:
 * - GitHub activity visualization
 * - Conference speaking timeline
 * - Job change signal alerts
 * - Content creation activity
 * - Approach readiness indicator
 */

import React, { useMemo } from 'react';
import type {
  BehavioralSignals,
  GitHubActivity,
  ConferenceSpeaking,
  JobChangeSignal,
  ContentActivity,
} from '../../types';

interface BehavioralTimelinePanelProps {
  signals: BehavioralSignals;
  candidateName: string;
}

const ACTIVITY_TREND_CONFIG = {
  increasing: { icon: 'fa-arrow-trend-up', color: 'text-emerald-400', label: 'Increasing' },
  stable: { icon: 'fa-minus', color: 'text-slate-400', label: 'Stable' },
  declining: { icon: 'fa-arrow-trend-down', color: 'text-red-400', label: 'Declining' },
};

const APPROACH_READINESS_CONFIG = {
  ready: {
    icon: 'fa-check-circle',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'High Readiness',
  },
  neutral: {
    icon: 'fa-minus-circle',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Moderate Readiness',
  },
  not_ready: {
    icon: 'fa-times-circle',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Low Readiness',
  },
};

export const BehavioralTimelinePanel: React.FC<BehavioralTimelinePanelProps> = ({
  signals,
}) => {
  const readinessConfig = APPROACH_READINESS_CONFIG[signals.approachReadiness];

  // Combine all activities into a timeline
  const timeline = useMemo(() => {
    const items: Array<{
      type: 'speaking' | 'job_signal' | 'content';
      date: string;
      data: ConferenceSpeaking | JobChangeSignal | ContentActivity;
    }> = [];

    signals.speakingEngagements.forEach((s) => {
      items.push({ type: 'speaking', date: s.date, data: s });
    });

    signals.jobChangeSignals.forEach((s) => {
      items.push({ type: 'job_signal', date: s.detectedAt, data: s });
    });

    signals.contentActivity.forEach((c) => {
      items.push({ type: 'content', date: c.date, data: c });
    });

    // Sort by date (most recent first)
    return items.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });
  }, [signals]);

  return (
    <div className="space-y-6">
      {/* Approach Readiness Banner */}
      <div className={`rounded-lg p-4 border ${readinessConfig.bg} ${readinessConfig.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <i className={`fa-solid ${readinessConfig.icon} ${readinessConfig.color} text-2xl mr-3`}></i>
            <div>
              <div className={`text-sm font-semibold ${readinessConfig.color}`}>
                {readinessConfig.label}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {signals.bestTimeToReach}
              </div>
            </div>
          </div>
          {signals.openToWorkSignal && (
            <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              OPEN TO WORK
            </div>
          )}
        </div>
      </div>

      {/* GitHub Activity */}
      {signals.github && (
        <GitHubActivityCard github={signals.github} />
      )}

      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ActivityStat
          icon="fa-microphone"
          label="Speaking Events"
          value={signals.speakingEngagements.length}
          color="text-blue-400"
        />
        <ActivityStat
          icon="fa-bell"
          label="Job Signals"
          value={signals.jobChangeSignals.length}
          color="text-amber-400"
        />
        <ActivityStat
          icon="fa-pen"
          label="Content Posts"
          value={signals.contentActivity.length}
          color="text-blue-400"
        />
        <ActivityStat
          icon="fa-user-pen"
          label="Profile Updates"
          value={signals.recentProfileUpdates}
          subtext="last 30 days"
          color="text-slate-400"
        />
      </div>

      {/* Activity Timeline */}
      {timeline.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
            <i className="fa-solid fa-timeline text-blue-400 mr-2"></i>
            Activity Timeline
          </h3>
          <div className="space-y-3">
            {timeline.slice(0, 10).map((item, idx) => (
              <TimelineItem key={idx} item={item} />
            ))}
          </div>
          {timeline.length > 10 && (
            <div className="text-xs text-slate-500 text-center mt-3">
              + {timeline.length - 10} more activities
            </div>
          )}
        </div>
      )}

      {/* Engagement Recency */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Overall Engagement:
          <span className={`ml-1 capitalize ${signals.engagementRecency === 'active' ? 'text-emerald-400' :
              signals.engagementRecency === 'moderate' ? 'text-amber-400' :
                'text-red-400'
            }`}>
            {signals.engagementRecency}
          </span>
        </span>
        <span>
          <i className="fa-solid fa-clock mr-1"></i>
          Updated: {new Date(signals.generatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// GitHub Activity Card
const GitHubActivityCard: React.FC<{ github: GitHubActivity }> = ({ github }) => {
  const trendConfig = ACTIVITY_TREND_CONFIG[github.activityTrend];

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center">
          <i className="fa-brands fa-github text-slate-300 mr-2"></i>
          GitHub Activity
        </h3>
        <a
          href={github.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:underline"
        >
          @{github.username} <i className="fa-solid fa-external-link ml-1"></i>
        </a>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{github.totalContributions}</div>
          <div className="text-xs text-slate-400">Contributions</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white">{github.contributionStreak}</div>
          <div className="text-xs text-slate-400">Day Streak</div>
        </div>
        <div className="text-center flex flex-col items-center">
          <div className={`text-xl font-bold flex items-center ${trendConfig.color}`}>
            <i className={`fa-solid ${trendConfig.icon} mr-1`}></i>
            {trendConfig.label}
          </div>
          <div className="text-xs text-slate-400">Activity Trend</div>
        </div>
      </div>

      {/* Top Languages */}
      {github.topLanguages.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-2">Top Languages</div>
          <div className="flex gap-2 flex-wrap">
            {github.topLanguages.slice(0, 5).map((lang, idx) => (
              <span
                key={idx}
                className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded"
              >
                {lang.language} <span className="text-slate-500">{lang.percentage}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Repos */}
      {github.recentRepos.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-2">Recent Repositories</div>
          <div className="space-y-2">
            {github.recentRepos.slice(0, 3).map((repo, idx) => (
              <div key={idx} className="bg-slate-700/50 rounded px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{repo.name}</span>
                  <div className="flex items-center text-xs text-slate-400">
                    <i className="fa-solid fa-star text-yellow-400 mr-1"></i>
                    {repo.stars}
                  </div>
                </div>
                {repo.description && (
                  <div className="text-xs text-slate-400 mt-1 truncate">
                    {repo.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Source Contributions */}
      {github.openSourceContributions.length > 0 && (
        <div>
          <div className="text-xs text-slate-400 mb-2">Open Source Contributions</div>
          <div className="flex gap-2 flex-wrap">
            {github.openSourceContributions.slice(0, 5).map((contrib, idx) => (
              <span
                key={idx}
                className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded"
              >
                {contrib.repo.split('/').pop()} ({contrib.count} {contrib.type}s)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Stat Card
const ActivityStat: React.FC<{
  icon: string;
  label: string;
  value: number;
  subtext?: string;
  color: string;
}> = ({ icon, label, value, subtext, color }) => (
  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
    <i className={`fa-solid ${icon} ${color} text-lg mb-1`}></i>
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-xs text-slate-400">{label}</div>
    {subtext && <div className="text-[10px] text-slate-500">{subtext}</div>}
  </div>
);

// Timeline Item
const TimelineItem: React.FC<{
  item: {
    type: 'speaking' | 'job_signal' | 'content';
    date: string;
    data: ConferenceSpeaking | JobChangeSignal | ContentActivity;
  };
}> = ({ item }) => {
  const config = {
    speaking: { icon: 'fa-microphone', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    job_signal: { icon: 'fa-bell', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    content: { icon: 'fa-pen', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  };

  const c = config[item.type];

  const renderContent = () => {
    if (item.type === 'speaking') {
      const s = item.data as ConferenceSpeaking;
      return (
        <div>
          <div className="text-sm text-white">{s.eventName}</div>
          <div className="text-xs text-slate-400">{s.topic}</div>
        </div>
      );
    }
    if (item.type === 'job_signal') {
      const s = item.data as JobChangeSignal;
      return (
        <div>
          <div className="text-sm text-white capitalize">{s.type.replace('_', ' ')}</div>
          <div className="text-xs text-slate-400">{s.interpretation}</div>
        </div>
      );
    }
    if (item.type === 'content') {
      const s = item.data as ContentActivity;
      return (
        <div>
          <div className="text-sm text-white">{s.topic || `${s.type} on ${s.platform}`}</div>
          <div className="text-xs text-slate-400 capitalize">{s.platform}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex items-start">
      <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center mr-3 flex-shrink-0`}>
        <i className={`fa-solid ${c.icon} ${c.color} text-sm`}></i>
      </div>
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
      <div className="text-xs text-slate-500 ml-2 flex-shrink-0">
        {item.date !== 'Unknown' ? formatDate(item.date) : 'Unknown'}
      </div>
    </div>
  );
};

// Utility
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default BehavioralTimelinePanel;
