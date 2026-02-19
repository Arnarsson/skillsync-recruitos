import { describe, it, expect } from 'vitest';
import { computeNetworkIntelligence } from '../../../services/jobReadiness/pillar1-network';
import type { ReadinessInput } from '../../../services/jobReadiness/types';

const baseInput: ReadinessInput = {
  candidateId: 'test-1',
  githubUsername: 'testuser',
  githubProfile: {
    login: 'testuser',
    public_repos: 30,
    followers: 50,
    following: 100,
    created_at: '2020-01-01T00:00:00Z',
    bio: 'Software engineer',
    company: 'CurrentCo',
  },
  githubRepos: [],
  githubEvents: [],
};

describe('pillar1-network: computeNetworkIntelligence', () => {
  it('returns null score when no GitHub data available', async () => {
    const result = await computeNetworkIntelligence({ candidateId: 'test-1' });
    expect(result.pillar).toBe('networkIntelligence');
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('detects target company repo starring', async () => {
    const input: ReadinessInput = {
      ...baseInput,
      githubRepos: [
        {
          name: 'target-oss',
          language: 'TypeScript',
          stargazers_count: 1000,
          forks_count: 200,
          pushed_at: new Date().toISOString(),
          created_at: '2024-01-01T00:00:00Z',
          topics: [],
          fork: true,
        },
      ],
      githubEvents: [
        {
          type: 'WatchEvent',
          created_at: new Date().toISOString(),
          repo: { name: 'target-company/their-repo' },
        },
        {
          type: 'ForkEvent',
          created_at: new Date().toISOString(),
          repo: { name: 'target-company/another-repo' },
        },
      ],
    };
    const result = await computeNetworkIntelligence(input);
    expect(result.score).toBeGreaterThan(0);
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('scores higher with more target company engagement', async () => {
    const lowEngagement: ReadinessInput = {
      ...baseInput,
      githubEvents: [
        { type: 'WatchEvent', created_at: new Date().toISOString(), repo: { name: 'random/repo' } },
      ],
    };
    const highEngagement: ReadinessInput = {
      ...baseInput,
      githubEvents: Array(10).fill(null).map((_, i) => ({
        type: i % 2 === 0 ? 'WatchEvent' : 'ForkEvent',
        created_at: new Date().toISOString(),
        repo: { name: `company-${i % 3}/repo-${i}` },
      })),
    };
    const low = await computeNetworkIntelligence(lowEngagement);
    const high = await computeNetworkIntelligence(highEngagement);
    expect(high.score!).toBeGreaterThanOrEqual(low.score!);
  });

  it('detects high following-to-followers ratio as exploration signal', async () => {
    const explorer: ReadinessInput = {
      ...baseInput,
      githubProfile: {
        ...baseInput.githubProfile!,
        following: 500,
        followers: 20,
      },
    };
    const result = await computeNetworkIntelligence(explorer);
    const followSignal = result.signals.find(s => s.name === 'following_ratio');
    expect(followSignal).toBeDefined();
    expect(followSignal!.normalizedValue).toBeGreaterThan(50);
  });

  it('caps score at 100', async () => {
    const maxInput: ReadinessInput = {
      ...baseInput,
      githubProfile: { ...baseInput.githubProfile!, following: 10000, followers: 1 },
      githubEvents: Array(100).fill(null).map((_, i) => ({
        type: 'ForkEvent',
        created_at: new Date().toISOString(),
        repo: { name: `company-${i}/repo-${i}` },
      })),
    };
    const result = await computeNetworkIntelligence(maxInput);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
