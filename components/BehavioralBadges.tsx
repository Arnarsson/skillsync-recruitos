"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Mail,
  Activity,
} from "lucide-react";

interface ActivitySignals {
  openToWork: boolean;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
  activityTrend: 'increasing' | 'stable' | 'decreasing';
  recentActivityCount: number;
}

interface EngagementScore {
  score: number;
  factors: {
    activityRecency: number;
    contactability: number;
    signalStrength: number;
    responsiveness: number;
  };
  bestOutreachTime: string | null;
  timezone: string | null;
}

interface BehavioralInsights {
  activitySignals: ActivitySignals;
  engagementScore: EngagementScore;
  fetchedAt: string;
}

interface BehavioralBadgesProps {
  username: string;
  compact?: boolean;
  className?: string;
}

/**
 * Displays behavioral insight badges for a candidate
 * - "Open to Work" badge with confidence level
 * - Engagement score
 * - Activity trend indicator
 */
// Helper to check cache synchronously
function getCachedBehavioralInsights(username: string): BehavioralInsights | null {
  if (typeof window === 'undefined') return null;
  const cacheKey = `behavioral_${username}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    } catch {
      // Ignore parse errors
    }
  }
  return null;
}

export function BehavioralBadges({ username, compact = false, className = "" }: BehavioralBadgesProps) {
  // Use lazy initializer to check cache synchronously on first render
  const [insights, setInsights] = useState<BehavioralInsights | null>(() =>
    getCachedBehavioralInsights(username)
  );
  const [loading, setLoading] = useState(() => {
    // If we have cached insights, don't show loading
    return getCachedBehavioralInsights(username) === null;
  });
  const [error, setError] = useState(false);

  useEffect(() => {
    // If we already have cached data, skip fetch
    if (insights) return;

    // Fetch fresh data
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/github/signals?username=${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setInsights(data);
        // Cache the result
        const cacheKey = `behavioral_${username}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now(),
        }));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username, insights]);

  if (loading || error || !insights) {
    return null;
  }

  const { activitySignals, engagementScore } = insights;

  const TrendIcon = activitySignals.activityTrend === 'increasing'
    ? TrendingUp
    : activitySignals.activityTrend === 'decreasing'
      ? TrendingDown
      : Minus;

  const trendColor = activitySignals.activityTrend === 'increasing'
    ? 'text-green-500'
    : activitySignals.activityTrend === 'decreasing'
      ? 'text-red-500'
      : 'text-muted-foreground';

  const confidenceColor = {
    high: 'bg-green-500/20 text-green-600 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  };

  const engagementColor = engagementScore.score >= 70
    ? 'bg-green-500/20 text-green-600'
    : engagementScore.score >= 40
      ? 'bg-yellow-500/20 text-yellow-600'
      : 'bg-muted text-muted-foreground';

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <TooltipProvider>
          {activitySignals.openToWork && (
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className={`h-5 px-1.5 ${confidenceColor[activitySignals.confidence]}`}
                >
                  <Sparkles className="w-3 h-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Open to Work</p>
                <p className="text-xs text-muted-foreground">
                  {activitySignals.confidence} confidence
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className={`h-5 px-1.5 ${engagementColor}`}>
                <Activity className="w-3 h-3 mr-0.5" />
                <span className="text-xs">{engagementScore.score}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">Engagement Score: {engagementScore.score}/100</p>
              <p className="text-xs text-muted-foreground">
                Likelihood of response
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <TooltipProvider>
        {/* Open to Work Badge */}
        {activitySignals.openToWork && (
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className={`${confidenceColor[activitySignals.confidence]}`}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Open to Work
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium mb-1">Open to Work Signals</p>
              <ul className="text-xs space-y-1">
                {activitySignals.signals.slice(0, 4).map((signal, i) => (
                  <li key={i} className="text-muted-foreground">• {signal}</li>
                ))}
              </ul>
              <p className="text-xs mt-2 text-muted-foreground">
                Confidence: {activitySignals.confidence}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Engagement Score */}
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={engagementColor}>
              <Activity className="w-3 h-3 mr-1" />
              Engagement: {engagementScore.score}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium mb-2">Engagement Score Breakdown</p>
            <div className="text-xs space-y-1">
              <div className="flex justify-between gap-4">
                <span>Activity Recency</span>
                <span>{engagementScore.factors.activityRecency}/30</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Contactability</span>
                <span>{engagementScore.factors.contactability}/25</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Signal Strength</span>
                <span>{engagementScore.factors.signalStrength}/25</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Responsiveness</span>
                <span>{engagementScore.factors.responsiveness}/20</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Activity Trend */}
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="bg-muted/50">
              <TrendIcon className={`w-3 h-3 mr-1 ${trendColor}`} />
              {activitySignals.activityTrend === 'increasing' ? 'Rising' :
               activitySignals.activityTrend === 'decreasing' ? 'Declining' : 'Stable'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Activity trend over recent period</p>
            <p className="text-xs text-muted-foreground">
              {activitySignals.recentActivityCount} events in last 7 days
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Best Time to Reach */}
        {engagementScore.bestOutreachTime && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="bg-muted/50">
                <Clock className="w-3 h-3 mr-1" />
                {engagementScore.bestOutreachTime}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Best time to reach out</p>
              {engagementScore.timezone && (
                <p className="text-xs text-muted-foreground">
                  Timezone: {engagementScore.timezone}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}

// Helper to check OTW cache synchronously
function getCachedOpenToWork(username: string): { show: boolean; confidence: 'high' | 'medium' | 'low' } | null {
  if (typeof window === 'undefined') return null;
  const cacheKey = `otw_${username}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    } catch {
      // Ignore parse errors
    }
  }
  return null;
}

/**
 * Simple inline badge showing just the "Open to Work" status
 */
export function OpenToWorkBadge({ username, className = "" }: { username: string; className?: string }) {
  // Use lazy initializer to check cache synchronously on first render
  const [openToWork, setOpenToWork] = useState<{ show: boolean; confidence: 'high' | 'medium' | 'low' } | null>(() =>
    getCachedOpenToWork(username)
  );

  useEffect(() => {
    // If we already have cached data, skip fetch
    if (openToWork !== null) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/github/signals?username=${encodeURIComponent(username)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data: BehavioralInsights = await res.json();
        const result = {
          show: data.activitySignals.openToWork,
          confidence: data.activitySignals.confidence,
        };
        setOpenToWork(result);
        const cacheKey = `otw_${username}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now(),
        }));
      } catch {
        setOpenToWork(null);
      }
    };
    fetchData();
  }, [username, openToWork]);

  if (!openToWork?.show) return null;

  const colors = {
    high: 'bg-green-500 text-white',
    medium: 'bg-green-400 text-white',
    low: 'bg-green-300 text-green-900',
  };

  return (
    <Badge className={`${colors[openToWork.confidence]} ${className}`}>
      <Sparkles className="w-3 h-3 mr-1" />
      Open to Work
    </Badge>
  );
}

export default BehavioralBadges;
