'use client';

import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  Users, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Search
} from 'lucide-react';
import { parseLinkedInExport, ParsedLinkedInData } from '@/lib/linkedin-parser';
import { 
  generateNetworkIntelligenceReport, 
  NetworkIntelligenceReport,
  findWarmPaths,
  WarmPath
} from '@/lib/linkedin-parser/network-intelligence';
import {
  SAMPLE_CONNECTIONS_CSV,
  SAMPLE_MESSAGES_CSV,
  SAMPLE_ENDORSEMENTS_RECEIVED_CSV,
  SAMPLE_ENDORSEMENTS_GIVEN_CSV,
  SAMPLE_RECOMMENDATIONS_RECEIVED_CSV,
  SAMPLE_RECOMMENDATIONS_GIVEN_CSV,
} from '@/lib/linkedin-parser/sample-data';

// ============================================================================
// TYPES
// ============================================================================

type TabId = 'overview' | 'health' | 'vouch' | 'reciprocity' | 'resurrection' | 'warm-paths';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NetworkIntelligence() {
  const [linkedInData, setLinkedInData] = useState<ParsedLinkedInData | null>(null);
  const [report, setReport] = useState<NetworkIntelligenceReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  
  // Warm path search
  const [searchTarget, setSearchTarget] = useState('');
  const [warmPaths, setWarmPaths] = useState<WarmPath[]>([]);

  // Load demo data
  const handleLoadDemo = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const data = await parseLinkedInExport({
        connections: SAMPLE_CONNECTIONS_CSV,
        messages: SAMPLE_MESSAGES_CSV,
        endorsementsReceived: SAMPLE_ENDORSEMENTS_RECEIVED_CSV,
        endorsementsGiven: SAMPLE_ENDORSEMENTS_GIVEN_CSV,
        recommendationsReceived: SAMPLE_RECOMMENDATIONS_RECEIVED_CSV,
        recommendationsGiven: SAMPLE_RECOMMENDATIONS_GIVEN_CSV,
      });
      
      setLinkedInData(data);
      const intelligenceReport = generateNetworkIntelligenceReport(data);
      setReport(intelligenceReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load demo data');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const fileContents: Record<string, string> = {};

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await file.text();
        const name = file.name.toLowerCase();

        if (name.includes('connection')) {
          fileContents.connections = content;
        } else if (name.includes('message')) {
          fileContents.messages = content;
        } else if (name.includes('endorsement') && name.includes('received')) {
          fileContents.endorsementsReceived = content;
        } else if (name.includes('endorsement') && name.includes('given')) {
          fileContents.endorsementsGiven = content;
        } else if (name.includes('recommendation') && name.includes('received')) {
          fileContents.recommendationsReceived = content;
        } else if (name.includes('recommendation') && name.includes('given')) {
          fileContents.recommendationsGiven = content;
        }
      }

      if (!fileContents.connections) {
        throw new Error('Please include your Connections.csv file');
      }

      const data = await parseLinkedInExport(fileContents);
      setLinkedInData(data);

      const intelligenceReport = generateNetworkIntelligenceReport(data);
      setReport(intelligenceReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse LinkedIn export');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle warm path search
  const handleWarmPathSearch = useCallback(() => {
    if (!linkedInData || !searchTarget.trim()) return;
    
    const paths = findWarmPaths(linkedInData, undefined, searchTarget.trim());
    setWarmPaths(paths);
    setActiveTab('warm-paths');
  }, [linkedInData, searchTarget]);

  // Render upload state
  if (!linkedInData) {
    return <UploadState onFileUpload={handleFileUpload} onLoadDemo={handleLoadDemo} isProcessing={isProcessing} error={error} />;
  }

  // Render dashboard
  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Network Intelligence</h1>
          <p className="text-gray-400 text-sm mt-1">
            {report?.summary.totalConnections.toLocaleString()} connections analyzed
          </p>
        </div>
        
        {/* Warm Path Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Find path to company..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWarmPathSearch()}
              className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <button
            onClick={handleWarmPathSearch}
            disabled={!searchTarget.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Find Warm Path
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex gap-1 bg-gray-900/50 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'health', label: 'Relationship Health', icon: Clock },
          { id: 'vouch', label: 'Vouch Scores', icon: Users },
          { id: 'reciprocity', label: 'Reciprocity', icon: RefreshCw },
          { id: 'resurrection', label: 'Resurrect', icon: MessageSquare },
          { id: 'warm-paths', label: 'Warm Paths', icon: Target },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      {activeTab === 'overview' && report && <OverviewTab report={report} />}
      {activeTab === 'health' && report && <HealthTab health={report.relationshipHealth} />}
      {activeTab === 'vouch' && report && <VouchTab scores={report.vouchScores} />}
      {activeTab === 'reciprocity' && report && <ReciprocityTab ledger={report.reciprocityLedger} />}
      {activeTab === 'resurrection' && report && <ResurrectionTab opportunities={report.resurrectionOpportunities} />}
      {activeTab === 'warm-paths' && <WarmPathsTab paths={warmPaths} />}
    </div>
  );
}

// ============================================================================
// UPLOAD STATE
// ============================================================================

function UploadState({ 
  onFileUpload, 
  onLoadDemo,
  isProcessing, 
  error 
}: { 
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadDemo: () => void;
  isProcessing: boolean;
  error: string | null;
}) {
  return (
    <div className="p-6 bg-gray-950 min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Network Intelligence</h1>
          <p className="text-gray-400 mt-2">
            Upload your LinkedIn export to discover warm paths to any candidate
          </p>
        </div>

        <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            multiple
            accept=".csv"
            onChange={onFileUpload}
            className="hidden"
            id="linkedin-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="linkedin-upload"
            className={`cursor-pointer ${isProcessing ? 'opacity-50' : ''}`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
                <p className="text-gray-300">Analyzing your network...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-gray-500" />
                <p className="text-gray-300">Drop your LinkedIn export files here</p>
                <p className="text-gray-500 text-sm">
                  Connections.csv, messages.csv, endorsements, recommendations
                </p>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="text-center">
          <p className="text-gray-500 text-sm mb-3">or</p>
          <button
            onClick={onLoadDemo}
            disabled={isProcessing}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            🎯 Try with Demo Data
          </button>
          <p className="text-gray-500 text-xs mt-2">See how it works with sample LinkedIn data</p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <h3 className="font-medium text-white mb-2">How to export your LinkedIn data:</h3>
          <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
            <li>Go to LinkedIn Settings → Data Privacy</li>
            <li>Click "Get a copy of your data"</li>
            <li>Select "Want something in particular?" and choose: Connections, Messages, Endorsements, Recommendations</li>
            <li>Download and unzip, then upload the CSV files here</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ report }: { report: NetworkIntelligenceReport }) {
  const { summary, archetype } = report;
  
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Connections" value={summary.totalConnections} />
        <StatCard label="Strong Relationships" value={summary.strongRelationships} color="green" />
        <StatCard label="Cooling Down" value={summary.coolingRelationships} color="yellow" />
        <StatCard label="Dormant" value={summary.dormantRelationships} color="red" />
        <StatCard label="Top Advocates" value={summary.topAdvocates} color="blue" />
        <StatCard label="Resurrection Ops" value={summary.resurrectionOpportunities} color="purple" />
      </div>

      {/* Network Archetype */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Your Network Archetype</h2>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white capitalize">
              {archetype.primary.replace(/_/g, ' ')}
            </h3>
            <p className="text-gray-400 mt-1">{archetype.recommendation}</p>
          </div>
        </div>
        
        {/* Archetype Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <ScoreBar label="Engagement Level" value={archetype.scores.engagementLevel} />
          <ScoreBar label="Breadth vs Depth" value={(archetype.scores.breadthVsDepth + 1) / 2} />
          <ScoreBar label="Initiative" value={(archetype.scores.initiationRatio + 1) / 2} />
          <ScoreBar label="Reciprocity" value={(archetype.scores.reciprocityBalance + 1) / 2} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HEALTH TAB
// ============================================================================

function HealthTab({ health }: { health: NetworkIntelligenceReport['relationshipHealth'] }) {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Relationship Health</h2>
        <p className="text-gray-400 text-sm">Based on half-life decay model (180 days = 50% decay)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Connection</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Company</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Strength</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Days Since Contact</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Messages</th>
            </tr>
          </thead>
          <tbody>
            {health.slice(0, 50).map((item, i) => (
              <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white font-medium">{item.connection.fullName}</td>
                <td className="px-4 py-3 text-gray-400">{item.connection.company || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <StrengthBadge value={item.currentStrength} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-center text-gray-400">{item.daysSinceContact}d</td>
                <td className="px-4 py-3 text-center text-gray-400">{item.messageCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// VOUCH TAB
// ============================================================================

function VouchTab({ scores }: { scores: NetworkIntelligenceReport['vouchScores'] }) {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Vouch Scores</h2>
        <p className="text-gray-400 text-sm">Predicts who would advocate for you if asked</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Connection</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Score</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Level</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Recommendation</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Endorsements</th>
            </tr>
          </thead>
          <tbody>
            {scores.slice(0, 50).map((item, i) => (
              <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white font-medium">{item.connection.fullName}</td>
                <td className="px-4 py-3 text-center">
                  <StrengthBadge value={item.score} />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.level === 'strong_advocate' ? 'bg-green-500/20 text-green-400' :
                    item.level === 'reliable' ? 'bg-blue-500/20 text-blue-400' :
                    item.level === 'positive' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {item.level.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.factors.recommendationReceived > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-400">
                  {Math.floor(item.factors.endorsementsReceived / 3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// RECIPROCITY TAB
// ============================================================================

function ReciprocityTab({ ledger }: { ledger: NetworkIntelligenceReport['reciprocityLedger'] }) {
  const theyOweMe = ledger.filter(e => e.status === 'they_owe_me');
  const iOweThem = ledger.filter(e => e.status === 'i_owe_them');
  
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-green-500/10">
          <h2 className="text-lg font-semibold text-green-400">They Owe You ({theyOweMe.length})</h2>
          <p className="text-gray-400 text-sm">You've invested more in these relationships</p>
        </div>
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {theyOweMe.slice(0, 20).map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">{item.connection.fullName}</p>
                <p className="text-gray-500 text-sm">{item.connection.company}</p>
              </div>
              <span className="text-green-400 font-bold">+{item.netBalance}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-amber-500/10">
          <h2 className="text-lg font-semibold text-amber-400">You Owe Them ({iOweThem.length})</h2>
          <p className="text-gray-400 text-sm">They've invested more in you</p>
        </div>
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {iOweThem.slice(0, 20).map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">{item.connection.fullName}</p>
                <p className="text-gray-500 text-sm">{item.connection.company}</p>
              </div>
              <span className="text-amber-400 font-bold">{item.netBalance}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RESURRECTION TAB
// ============================================================================

function ResurrectionTab({ opportunities }: { opportunities: NetworkIntelligenceReport['resurrectionOpportunities'] }) {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Conversation Resurrection</h2>
        <p className="text-gray-400 text-sm">Dormant threads with natural re-engagement hooks</p>
      </div>
      <div className="divide-y divide-gray-800">
        {opportunities.slice(0, 20).map((opp, i) => (
          <div key={i} className="p-4 hover:bg-gray-800/30">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-medium">{opp.connection.fullName}</h3>
                <p className="text-gray-500 text-sm">{opp.connection.company}</p>
              </div>
              <span className="text-gray-500 text-sm">{opp.daysDormant} days dormant</span>
            </div>
            <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-amber-400 text-sm font-medium">{opp.hook}</p>
              <p className="text-gray-400 text-sm mt-1 italic">"{opp.lastMessage}"</p>
            </div>
            <div className="mt-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-blue-400 text-sm">{opp.suggestedOpener}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// WARM PATHS TAB
// ============================================================================

function WarmPathsTab({ paths }: { paths: WarmPath[] }) {
  if (paths.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-12 text-center">
        <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white font-medium">No warm paths found</h3>
        <p className="text-gray-500 mt-1">Search for a company name or executive (e.g., "Stripe", "Satya Nadella")</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">
          🎯 Warm Paths to {paths[0]?.targetName || paths[0]?.targetCompany}
        </h2>
        <p className="text-gray-400 text-sm">
          Ranked by evidence-based scoring • {paths.length} connection{paths.length !== 1 ? 's' : ''} found
        </p>
      </div>
      <div className="divide-y divide-gray-800">
        {paths.map((path, i) => {
          const scoreColor = path.score >= 13 ? 'green' : path.score >= 10 ? 'yellow' : 'orange';
          const scoreLabel = path.score >= 13 ? 'EXCELLENT' : path.score >= 10 ? 'GOOD' : 'POSSIBLE';
          
          return (
            <div key={i} className="p-4 hover:bg-gray-800/30">
              {/* Header with path visualization */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    You
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    scoreColor === 'green' ? 'bg-green-600' : scoreColor === 'yellow' ? 'bg-yellow-600' : 'bg-orange-600'
                  }`}>
                    {path.bridgePerson.firstName?.[0] || path.bridgePerson.fullName[0]}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    🎯
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{path.bridgePerson.fullName}</h3>
                  <p className="text-gray-500 text-sm">{path.bridgePerson.position} at {path.bridgePerson.company}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    scoreColor === 'green' ? 'bg-green-500/20 text-green-400' :
                    scoreColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {path.score}/15 {scoreLabel}
                  </span>
                </div>
              </div>
              
              {/* Evidence section */}
              {path.evidence && path.evidence.length > 0 && (
                <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 text-xs font-medium mb-2">📊 EVIDENCE</p>
                  <ul className="space-y-1">
                    {path.evidence.map((e, j) => (
                      <li key={j} className="text-gray-300 text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>
                  {path.reasoning && (
                    <p className="text-gray-500 text-sm mt-2 italic">{path.reasoning}</p>
                  )}
                </div>
              )}
              
              {/* Suggested approach */}
              <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-blue-400 text-xs font-medium mb-1">💬 SUGGESTED MESSAGE</p>
                <p className="text-blue-300 text-sm">{path.suggestedApproach}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function StatCard({ label, value, color = 'gray' }: { label: string; value: number; color?: string }) {
  const colors = {
    gray: 'text-gray-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };
  
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color as keyof typeof colors]}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function StrengthBadge({ value }: { value: number }) {
  const color = value >= 70 ? 'green' : value >= 40 ? 'yellow' : 'red';
  const colors = {
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[color]}`}>
      {value}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    strong: 'bg-green-500/20 text-green-400',
    cooling: 'bg-yellow-500/20 text-yellow-400',
    cold: 'bg-orange-500/20 text-orange-400',
    dormant: 'bg-red-500/20 text-red-400',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[status] || colors.dormant}`}>
      {status}
    </span>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export default NetworkIntelligence;
