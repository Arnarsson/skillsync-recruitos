import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  AdvancedCandidateProfile,
  NetworkGraph,
  BehavioralSignals,
  CitedProfile
} from '../../types';

// Mock the dependent services
vi.mock('../../services/networkAnalysisService', () => ({
  buildNetworkGraph: vi.fn(),
  quickNetworkScan: vi.fn()
}));

vi.mock('../../services/behavioralSignalsService', () => ({
  collectBehavioralSignals: vi.fn(),
  quickBehavioralCheck: vi.fn()
}));

vi.mock('../../services/citedEvidenceService', () => ({
  buildCitedProfile: vi.fn()
}));

import {
  buildAdvancedProfile,
  quickEnrichment,
  deepEnrichment,
  mergeAdvancedProfile,
  getApproachReadinessSummary
} from '../../services/advancedEnrichmentService';
import { buildNetworkGraph, quickNetworkScan } from '../../services/networkAnalysisService';
import { collectBehavioralSignals, quickBehavioralCheck } from '../../services/behavioralSignalsService';
import { buildCitedProfile } from '../../services/citedEvidenceService';

// Sample mock data
const mockNetworkGraph: NetworkGraph = {
  candidateNodeId: 'candidate-1',
  nodes: [
    { id: 'candidate-1', type: 'candidate', name: 'John Doe', connectionStrength: 'strong' },
    { id: 'person-1', type: 'person', name: 'Jane Smith', role: 'Engineering Manager', connectionStrength: 'moderate' }
  ],
  edges: [
    { source: 'candidate-1', target: 'person-1', type: 'worked_with', weight: 0.8 }
  ],
  warmIntroPaths: [
    {
      targetPerson: 'John Doe',
      pathNodes: ['You', 'Jane Smith', 'John Doe'],
      pathLength: 2,
      introQuality: 'warm',
      suggestedApproach: 'Ask Jane Smith for an introduction',
      commonGround: ['Both worked at Google']
    }
  ],
  mutualConnections: [],
  sharedEmployers: [{ company: 'Google', overlap: '2019-2021', people: ['Jane Smith'] }],
  sharedSchools: [],
  industryInfluence: {
    thoughtLeadershipScore: 75,
    communityEngagement: ['React Community', 'TypeScript Users Group']
  },
  generatedAt: new Date().toISOString(),
  dataFreshness: 'live'
};

const mockBehavioralSignals: BehavioralSignals = {
  candidateId: 'candidate-1',
  github: {
    username: 'johndoe',
    profileUrl: 'https://github.com/johndoe',
    totalContributions: 500,
    contributionStreak: 45,
    topLanguages: [
      { language: 'TypeScript', percentage: 60 },
      { language: 'Python', percentage: 30 }
    ],
    recentRepos: [],
    openSourceContributions: [],
    activityTrend: 'increasing',
    lastActiveDate: new Date().toISOString()
  },
  speakingEngagements: [
    {
      eventName: 'ReactConf 2024',
      date: '2024-05-15',
      topic: 'Advanced React Patterns',
      role: 'speaker'
    }
  ],
  jobChangeSignals: [],
  contentActivity: [],
  openToWorkSignal: true,
  recentProfileUpdates: 3,
  engagementRecency: 'active',
  bestTimeToReach: 'Weekday mornings',
  approachReadiness: 'ready',
  generatedAt: new Date().toISOString()
};

const mockCitedProfile: CitedProfile = {
  candidateId: 'candidate-1',
  name: {
    claim: 'John Doe',
    sourceUrl: 'https://linkedin.com/in/johndoe',
    sourceType: 'linkedin',
    extractedText: 'John Doe',
    confidence: 1.0,
    verificationStatus: 'verified'
  },
  headline: null,
  location: null,
  experiences: [],
  skills: [],
  education: [],
  certifications: [],
  uncitedClaims: [],
  dataQualityScore: 85,
  sourcesUsed: [{ url: 'https://linkedin.com/in/johndoe', type: 'linkedin', reliability: 0.9 }],
  generatedAt: new Date().toISOString()
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('advancedEnrichmentService', () => {
  describe('buildAdvancedProfile', () => {
    it('should build a complete advanced profile when all services succeed', async () => {
      vi.mocked(buildNetworkGraph).mockResolvedValue(mockNetworkGraph);
      vi.mocked(collectBehavioralSignals).mockResolvedValue(mockBehavioralSignals);
      vi.mocked(buildCitedProfile).mockResolvedValue(mockCitedProfile);

      const input = {
        candidateId: 'candidate-1',
        candidateName: 'John Doe',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        githubUrl: 'https://github.com/johndoe',
        evidenceSources: [{ url: 'https://linkedin.com/in/johndoe', rawText: 'Profile text' }]
      };

      const result = await buildAdvancedProfile(input);

      expect(result.candidateId).toBe('candidate-1');
      expect(result.networkGraph).toBeDefined();
      expect(result.behavioralSignals).toBeDefined();
      expect(result.citedProfile).toBeDefined();
      expect(result.overallConfidence).toBeGreaterThan(0);
      expect(result.dataCompleteness.network).toBeGreaterThan(0);
      expect(result.dataCompleteness.behavioral).toBeGreaterThan(0);
      expect(result.dataCompleteness.cited).toBeGreaterThan(0);
    });

    it('should handle partial failures gracefully', async () => {
      vi.mocked(buildNetworkGraph).mockRejectedValue(new Error('Network analysis failed'));
      vi.mocked(collectBehavioralSignals).mockResolvedValue(mockBehavioralSignals);
      vi.mocked(buildCitedProfile).mockResolvedValue(mockCitedProfile);

      const input = {
        candidateId: 'candidate-1',
        candidateName: 'John Doe',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        evidenceSources: [{ url: 'https://linkedin.com/in/johndoe', rawText: 'Profile text' }]
      };

      const result = await buildAdvancedProfile(input);

      expect(result.candidateId).toBe('candidate-1');
      expect(result.networkGraph).toBeUndefined();
      expect(result.behavioralSignals).toBeDefined();
      expect(result.citedProfile).toBeDefined();
    });

    it('should skip network analysis when linkedinUrl is not provided', async () => {
      vi.mocked(collectBehavioralSignals).mockResolvedValue(mockBehavioralSignals);
      vi.mocked(buildCitedProfile).mockResolvedValue(mockCitedProfile);

      const input = {
        candidateId: 'candidate-1',
        candidateName: 'John Doe',
        evidenceSources: [{ url: 'https://example.com', rawText: 'Profile text' }]
      };

      const result = await buildAdvancedProfile(input);

      expect(buildNetworkGraph).not.toHaveBeenCalled();
      expect(result.networkGraph).toBeUndefined();
    });
  });

  describe('quickEnrichment', () => {
    it('should use quick mode for network and behavioral analysis', async () => {
      vi.mocked(quickNetworkScan).mockResolvedValue(mockNetworkGraph);
      vi.mocked(quickBehavioralCheck).mockResolvedValue(mockBehavioralSignals);

      const input = {
        candidateId: 'candidate-1',
        candidateName: 'John Doe',
        linkedinUrl: 'https://linkedin.com/in/johndoe'
      };

      await quickEnrichment(input);

      expect(quickNetworkScan).toHaveBeenCalled();
      expect(quickBehavioralCheck).toHaveBeenCalled();
      expect(buildCitedProfile).not.toHaveBeenCalled();
    });
  });

  describe('deepEnrichment', () => {
    it('should include all enrichment options', async () => {
      vi.mocked(buildNetworkGraph).mockResolvedValue(mockNetworkGraph);
      vi.mocked(collectBehavioralSignals).mockResolvedValue(mockBehavioralSignals);
      vi.mocked(buildCitedProfile).mockResolvedValue(mockCitedProfile);

      const input = {
        candidateId: 'candidate-1',
        candidateName: 'John Doe',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        evidenceSources: [{ url: 'https://linkedin.com/in/johndoe', rawText: 'Profile text' }]
      };

      await deepEnrichment(input);

      expect(buildNetworkGraph).toHaveBeenCalled();
      expect(collectBehavioralSignals).toHaveBeenCalled();
      expect(buildCitedProfile).toHaveBeenCalled();
    });
  });

  describe('getApproachReadinessSummary', () => {
    it('should return ready status when behavioral signals indicate openness', () => {
      const profile: AdvancedCandidateProfile = {
        candidateId: 'candidate-1',
        behavioralSignals: mockBehavioralSignals,
        overallConfidence: 80,
        dataCompleteness: { network: 50, behavioral: 80, cited: 70 },
        lastUpdated: new Date().toISOString(),
        nextRefreshRecommended: new Date().toISOString()
      };

      const summary = getApproachReadinessSummary(profile);

      expect(summary.status).toBe('ready');
      expect(summary.headline).toContain('High approach readiness');
      // Check that details array contains at least one signal
      expect(summary.details.length).toBeGreaterThan(0);
    });

    it('should return neutral status when no behavioral signals available', () => {
      const profile: AdvancedCandidateProfile = {
        candidateId: 'candidate-1',
        overallConfidence: 50,
        dataCompleteness: { network: 0, behavioral: 0, cited: 0 },
        lastUpdated: new Date().toISOString(),
        nextRefreshRecommended: new Date().toISOString()
      };

      const summary = getApproachReadinessSummary(profile);

      expect(summary.status).toBe('neutral');
      expect(summary.headline).toContain('Insufficient data');
    });
  });

  describe('mergeAdvancedProfile', () => {
    it('should merge advanced profile data into candidate', () => {
      const candidate = {
        id: 'candidate-1',
        name: 'John Doe',
        currentRole: 'Senior Engineer',
        company: 'Tech Corp',
        location: 'San Francisco',
        yearsExperience: 8,
        avatar: '',
        alignmentScore: 85,
        shortlistSummary: 'Strong candidate',
        keyEvidence: [],
        risks: [],
        unlockedSteps: []
      };

      const advancedProfile: AdvancedCandidateProfile = {
        candidateId: 'candidate-1',
        networkGraph: mockNetworkGraph,
        behavioralSignals: mockBehavioralSignals,
        overallConfidence: 80,
        dataCompleteness: { network: 70, behavioral: 80, cited: 60 },
        lastUpdated: new Date().toISOString(),
        nextRefreshRecommended: new Date().toISOString()
      };

      const merged = mergeAdvancedProfile(candidate, advancedProfile);

      expect(merged.networkDossier).toBeDefined();
      expect(merged.connectionPath).toBeDefined();
      expect(merged.sharedContext).toBeDefined();
    });
  });
});
