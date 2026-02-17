import { describe, it, expect } from 'vitest';
import { computeReadinessScore } from '../../../services/jobReadiness/engine';

describe('engine: computeReadinessScore', () => {
  it('returns overall score aggregated from all pillars', async () => {
    const result = await computeReadinessScore({
      candidateId: 'test-1',
      githubUsername: 'testuser',
      githubProfile: {
        login: 'testuser',
        public_repos: 30,
        followers: 50,
        following: 200,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Looking for new opportunities',
        company: 'CurrentCo',
      },
      githubRepos: [],
      githubEvents: [],
    });

    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.pillars).toBeDefined();
    expect(Object.keys(result.pillars)).toHaveLength(7);
    expect(result.level).toMatch(/^(cold|warming|warm|hot)$/);
    expect(result.computedAt).toBeDefined();
  });

  it('re-weights when pillars return null', async () => {
    const result = await computeReadinessScore({ candidateId: 'test-1' });

    expect(result.overall).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.level).toBe('cold');
  });

  it('all pillar results are present in output', async () => {
    const result = await computeReadinessScore({
      candidateId: 'test-1',
      githubUsername: 'test',
      githubEvents: [
        { type: 'PushEvent', created_at: new Date().toISOString(), repo: { name: 'test/repo' } },
      ],
    });

    const pillarNames = Object.keys(result.pillars);
    expect(pillarNames).toContain('networkIntelligence');
    expect(pillarNames).toContain('engagementDecay');
    expect(pillarNames).toContain('skillDiversification');
    expect(pillarNames).toContain('companyHealth');
    expect(pillarNames).toContain('tenureRisk');
    expect(pillarNames).toContain('profileOptimization');
    expect(pillarNames).toContain('sentimentShift');
  });

  it('returns correct readiness level based on score', async () => {
    const result = await computeReadinessScore({ candidateId: 'test-1' });
    expect(['cold', 'warming', 'warm', 'hot']).toContain(result.level);
  });

  it('handles rich input with all data sources', async () => {
    const result = await computeReadinessScore({
      candidateId: 'test-rich',
      githubUsername: 'richuser',
      currentCompany: 'BigCo',
      yearsAtCompany: 2.5,
      githubProfile: {
        login: 'richuser',
        public_repos: 50,
        followers: 100,
        following: 500,
        created_at: '2018-01-01T00:00:00Z',
        bio: 'Open to work. Exploring new opportunities.',
        company: '@BigCo',
      },
      githubRepos: [
        {
          name: 'richuser',
          language: 'Markdown',
          stargazers_count: 0,
          forks_count: 0,
          pushed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          created_at: '2023-01-01T00:00:00Z',
          topics: [],
          fork: false,
        },
        {
          name: 'new-rust-project',
          language: 'Rust',
          stargazers_count: 3,
          forks_count: 0,
          pushed_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          topics: ['systems', 'performance'],
          fork: false,
        },
        {
          name: 'old-js-app',
          language: 'JavaScript',
          stargazers_count: 20,
          forks_count: 5,
          pushed_at: new Date(Date.now() - 400 * 86400000).toISOString(),
          created_at: '2020-01-01T00:00:00Z',
          topics: ['web'],
          fork: false,
        },
      ],
      githubEvents: [
        ...Array(5).fill(null).map((_, i) => ({
          type: 'WatchEvent',
          created_at: new Date(Date.now() - i * 86400000).toISOString(),
          repo: { name: `interesting-co/repo-${i}` },
        })),
        ...Array(10).fill(null).map((_, i) => ({
          type: 'PushEvent',
          created_at: new Date(Date.now() - (60 + i) * 86400000).toISOString(),
          repo: { name: 'richuser/old-project' },
        })),
      ],
    });

    // With rich data showing multiple signals, should score above cold
    expect(result.overall).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.dataSourcesSummary).toContain('github');

    // Multiple pillars should have scores
    const scoredPillars = Object.values(result.pillars).filter(p => p.score !== null);
    expect(scoredPillars.length).toBeGreaterThanOrEqual(3);
  });

  it('candidateId is passed through', async () => {
    const result = await computeReadinessScore({ candidateId: 'my-candidate-123' });
    expect(result.candidateId).toBe('my-candidate-123');
  });
});
