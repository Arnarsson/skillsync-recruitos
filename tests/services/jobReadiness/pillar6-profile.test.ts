import { describe, it, expect } from 'vitest';
import { computeProfileOptimization } from '../../../services/jobReadiness/pillar6-profile';
import type { ReadinessInput } from '../../../services/jobReadiness/types';

describe('pillar6-profile: computeProfileOptimization', () => {
  it('returns null score when no profile data', async () => {
    const result = await computeProfileOptimization({ candidateId: 'test-1' });
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('detects job-seeking keywords in bio', async () => {
    const result = await computeProfileOptimization({
      candidateId: 'test-1',
      githubProfile: {
        login: 'testuser',
        public_repos: 20,
        followers: 50,
        following: 100,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Open to work! Seeking new opportunities in distributed systems',
        company: null,
      },
    });
    const seekingSignal = result.signals.find(s => s.name === 'seeking_keywords');
    expect(seekingSignal).toBeDefined();
    expect(seekingSignal!.value).toBeGreaterThan(0);
    expect(seekingSignal!.confidence).toBe(0.9);
  });

  it('detects recently updated README repo', async () => {
    const result = await computeProfileOptimization({
      candidateId: 'test-1',
      githubUsername: 'testuser',
      githubProfile: {
        login: 'testuser',
        public_repos: 20,
        followers: 50,
        following: 100,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Engineer',
        company: 'SomeCo',
      },
      githubRepos: [{
        name: 'testuser',
        language: 'Markdown',
        stargazers_count: 0,
        forks_count: 0,
        pushed_at: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
        created_at: '2023-01-01T00:00:00Z',
        topics: [],
        fork: false,
      }],
    });
    const readmeSignal = result.signals.find(s => s.name === 'readme_freshness');
    expect(readmeSignal).toBeDefined();
    expect(readmeSignal!.normalizedValue).toBe(100); // within 7 days
  });

  it('detects stale profile (low score)', async () => {
    const result = await computeProfileOptimization({
      candidateId: 'test-1',
      githubProfile: {
        login: 'testuser',
        public_repos: 5,
        followers: 10,
        following: 20,
        created_at: '2020-01-01T00:00:00Z',
        bio: null,
        company: null,
      },
    });
    // No bio = low seeking keywords, no completeness
    expect(result.score).toBeLessThan(40);
  });

  it('detects website/portfolio repo activity', async () => {
    const result = await computeProfileOptimization({
      candidateId: 'test-1',
      githubUsername: 'testuser',
      githubProfile: {
        login: 'testuser',
        public_repos: 10,
        followers: 50,
        following: 50,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Developer',
        company: 'Co',
      },
      githubRepos: [{
        name: 'testuser.github.io',
        language: 'HTML',
        stargazers_count: 2,
        forks_count: 0,
        pushed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        created_at: '2022-01-01T00:00:00Z',
        topics: [],
        fork: false,
      }],
      location: 'San Francisco',
    });
    const websiteSignal = result.signals.find(s => s.name === 'website_activity');
    expect(websiteSignal).toBeDefined();
    expect(websiteSignal!.normalizedValue).toBe(90); // within 14 days
  });

  it('multiple signals compound', async () => {
    const result = await computeProfileOptimization({
      candidateId: 'test-1',
      githubUsername: 'testuser',
      location: 'Berlin',
      githubProfile: {
        login: 'testuser',
        public_repos: 20,
        followers: 100,
        following: 200,
        created_at: '2018-01-01T00:00:00Z',
        bio: 'Open to work. Looking for opportunities in ML',
        company: 'CurrentCo',
      },
      githubRepos: [
        {
          name: 'testuser',
          language: 'Markdown',
          stargazers_count: 0,
          forks_count: 0,
          pushed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          created_at: '2023-01-01T00:00:00Z',
          topics: [],
          fork: false,
        },
        {
          name: 'portfolio',
          language: 'HTML',
          stargazers_count: 5,
          forks_count: 0,
          pushed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          created_at: '2022-01-01T00:00:00Z',
          topics: [],
          fork: false,
        },
      ],
    });
    expect(result.signals.length).toBeGreaterThanOrEqual(3);
    expect(result.score).toBeGreaterThan(50);
  });
});
