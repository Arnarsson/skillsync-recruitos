'use client';

/**
 * Recruitment Funnel Metrics Dashboard
 * Linear Issue: 7-308 - Instrument Outcomes + Build Feedback Loop
 * 
 * Displays conversion rates, time metrics, and funnel analytics
 */

import { useEffect, useState } from 'react';
import type { FunnelAnalytics } from '@/types/analytics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

export default function MetricsPage() {
  const [analytics, setAnalytics] = useState<FunnelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `/api/analytics/funnel?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function exportData() {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `/api/analytics/export?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&format=csv`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `model-tuning-data-${startDate.toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  }

  function formatTime(ms: number): string {
    if (ms === 0) return 'N/A';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recruitment Funnel Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track conversion rates and optimize your hiring process
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex gap-2 border rounded-lg p-1">
            <Button
              variant={period === '7d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={period === '30d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('30d')}
            >
              30 Days
            </Button>
            <Button
              variant={period === '90d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('90d')}
            >
              90 Days
            </Button>
          </div>

          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Searches</div>
          <div className="text-3xl font-bold mt-2">
            {analytics?.totalSearches || 0}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600">Unique Candidates</div>
          <div className="text-3xl font-bold mt-2">
            {analytics?.totalCandidates || 0}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600">Avg. Time to Offer</div>
          <div className="text-3xl font-bold mt-2">
            {formatTime(analytics?.timeMetrics.totalAvgTimeToOfferMs || 0)}
          </div>
        </Card>
      </div>

      {/* Funnel Conversion Rates */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Funnel Conversion Rates</h2>

        <div className="space-y-4">
          {analytics?.stageConversions.map((stage, index) => (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-32 font-medium capitalize">{stage.stage}</div>
                  <div className="text-sm text-gray-600">
                    {stage.entered} candidates
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Converted</div>
                    <div className="font-bold">{stage.converted}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                    <div
                      className={`font-bold ${
                        stage.conversionRate >= 50
                          ? 'text-green-600'
                          : stage.conversionRate >= 25
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stage.conversionRate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="text-right w-24">
                    <div className="text-sm text-gray-600">Avg. Time</div>
                    <div className="text-sm font-medium">
                      {formatTime(stage.avgTimeToNextStageMs)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    stage.conversionRate >= 50
                      ? 'bg-green-500'
                      : stage.conversionRate >= 25
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${stage.conversionRate}%` }}
                />
              </div>

              {index < (analytics?.stageConversions.length || 0) - 1 && (
                <div className="h-8 flex items-center justify-center">
                  <div className="text-gray-400">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Time Metrics Breakdown */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Time Metrics Breakdown</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Search → Shortlist</div>
            <div className="text-xl font-bold mt-1">
              {formatTime(analytics?.timeMetrics.avgSearchToShortlistMs || 0)}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Shortlist → Outreach</div>
            <div className="text-xl font-bold mt-1">
              {formatTime(analytics?.timeMetrics.avgShortlistToOutreachMs || 0)}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Outreach → Reply</div>
            <div className="text-xl font-bold mt-1">
              {formatTime(analytics?.timeMetrics.avgOutreachToReplyMs || 0)}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Reply → Interview</div>
            <div className="text-xl font-bold mt-1">
              {formatTime(analytics?.timeMetrics.avgReplyToInterviewMs || 0)}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Interview → Offer</div>
            <div className="text-xl font-bold mt-1">
              {formatTime(analytics?.timeMetrics.avgInterviewToOfferMs || 0)}
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Total Avg</div>
            <div className="text-xl font-bold mt-1 text-blue-600">
              {formatTime(analytics?.timeMetrics.totalAvgTimeToOfferMs || 0)}
            </div>
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-3">📊 Next Steps for Model Improvement</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Export model tuning data (CSV) using the button above</li>
          <li>• Review conversion rates - identify bottlenecks in your funnel</li>
          <li>• Compare match score predictions with actual outcomes</li>
          <li>• Adjust ranking heuristics based on false positive/negative rates</li>
          <li>• Run weekly analysis to track improvement over time</li>
        </ul>
      </Card>
    </div>
  );
}
