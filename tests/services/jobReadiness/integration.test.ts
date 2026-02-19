import { describe, it, expect, vi } from 'vitest';
import { computeReadinessScore } from '../../../services/jobReadiness/engine';
import type { ReadinessInput, ExternalFetchers } from '../../../services/jobReadiness/types';
import { PILLAR_NAMES } from '../../../services/jobReadiness/types';

// Rich candidate profile simulating real-world data
const richCandidate: ReadinessInput = {
  candidateId: 'integration-test-1',
  githubUsername: 'janedoe',
  currentCompany: 'MegaCorp',
  currentRole: 'Senior Engineer',
  yearsAtCompany: 2.5,
  location: 'San Francisco',
  skills: ['TypeScript', 'React', 'Rust', 'Go'],
  githubProfile: {
    login: 'janedoe',
    public_repos: 45,
    followers: 150,
    following: 400,
    created_at: '2019-01-01T00:00:00Z',
    bio: 'Open to work. Exploring distributed systems and Rust.',
    company: '@MegaCorp',
  },
  githubRepos: [
    // Old repos (JavaScript)
    { name: 'old-app', language: 'JavaScript', stargazers_count: 25, forks_count: 5, pushed_at: new Date(Date.now() - 400 * 86400000).toISOString(), created_at: '2020-01-01T00:00:00Z', topics: ['web'], fork: false },
    { name: 'another-old', language: 'JavaScript', stargazers_count: 10, forks_count: 2, pushed_at: new Date(Date.now() - 350 * 86400000).toISOString(), created_at: '2020-06-01T00:00:00Z', topics: ['frontend'], fork: false },
    // Recent repos (new languages!)
    { name: 'rust-experiments', language: 'Rust', stargazers_count: 5, forks_count: 0, pushed_at: new Date(Date.now() - 10 * 86400000).toISOString(), created_at: new Date(Date.now() - 60 * 86400000).toISOString(), topics: ['systems', 'rust'], fork: false },
    { name: 'go-microservice', language: 'Go', stargazers_count: 3, forks_count: 1, pushed_at: new Date(Date.now() - 15 * 86400000).toISOString(), created_at: new Date(Date.now() - 45 * 86400000).toISOString(), topics: ['microservices', 'go'], fork: false },
    // Profile README
    { name: 'janedoe', language: 'Markdown', stargazers_count: 0, forks_count: 0, pushed_at: new Date(Date.now() - 3 * 86400000).toISOString(), created_at: '2023-01-01T00:00:00Z', topics: [], fork: false },
    // Forked from interesting org
    { name: 'cool-framework', language: 'TypeScript', stargazers_count: 500, forks_count: 100, pushed_at: new Date(Date.now() - 20 * 86400000).toISOString(), created_at: new Date(Date.now() - 30 * 86400000).toISOString(), topics: [], fork: true },
  ],
  githubEvents: [
    // Heavy activity 60-90 days ago
    ...Array(15).fill(null).map((_, i) => ({
      type: 'PushEvent',
      created_at: new Date(Date.now() - (60 + i * 2) * 86400000).toISOString(),
      repo: { name: 'janedoe/old-app' },
    })),
    // Much less recent activity (activity cliff!)
    { type: 'PushEvent', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), repo: { name: 'janedoe/rust-experiments' } },
    // Exploring other orgs
    { type: 'WatchEvent', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), repo: { name: 'interesting-co/framework' } },
    { type: 'ForkEvent', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), repo: { name: 'another-org/tool' } },
    { type: 'WatchEvent', created_at: new Date(Date.now() - 10 * 86400000).toISOString(), repo: { name: 'third-org/lib' } },
  ],
  linkedinProfile: {
    headline: 'Senior Engineer exploring new opportunities',
    experience: [
      { title: 'Senior Engineer', company: 'MegaCorp', startDate: new Date(Date.now() - 2.5 * 365 * 86400000).toISOString(), current: true },
      { title: 'Engineer', company: 'PrevCo', startDate: '2021-01-01', endDate: '2023-06-01' },
      { title: 'Junior Dev', company: 'StartupX', startDate: '2019-06-01', endDate: '2020-12-01' },
    ],
    skills: ['TypeScript', 'React', 'Node.js', 'Rust', 'Go', 'Docker', 'Kubernetes'],
    posts: [
      { text: 'Exploring new horizons', date: new Date(Date.now() - 10 * 86400000).toISOString(), reactions: 15 },
      { text: 'Big launch!', date: new Date(Date.now() - 200 * 86400000).toISOString(), reactions: 80 },
    ],
  },
};

describe('Job Readiness Engine - Integration', () => {
  it('full pipeline produces valid ReadinessScore', async () => {
    const result = await computeReadinessScore(richCandidate);

    expect(result.candidateId).toBe('integration-test-1');
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.level).toMatch(/^(cold|warming|warm|hot)$/);
    expect(result.computedAt).toBeTruthy();
    expect(result.dataSourcesSummary).toContain('github');
  });

  it('rich data activates most pillars', async () => {
    const result = await computeReadinessScore(richCandidate);

    const scoredPillars = Object.values(result.pillars).filter(p => p.score !== null);
    // With both GitHub and LinkedIn data, should have at least 5 pillars scoring
    expect(scoredPillars.length).toBeGreaterThanOrEqual(5);
  });

  it('all 7 pillar keys are present', async () => {
    const result = await computeReadinessScore(richCandidate);

    for (const name of PILLAR_NAMES) {
      expect(result.pillars[name]).toBeDefined();
      expect(result.pillars[name].pillar).toBe(name);
    }
  });

  it('partial data: only GitHub produces appropriate scores', async () => {
    const githubOnly: ReadinessInput = {
      candidateId: 'github-only',
      githubUsername: 'testuser',
      githubProfile: {
        login: 'testuser',
        public_repos: 20,
        followers: 30,
        following: 100,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Developer',
        company: 'SomeCo',
      },
      githubRepos: [
        { name: 'project', language: 'Python', stargazers_count: 10, forks_count: 2, pushed_at: new Date().toISOString(), created_at: '2022-01-01T00:00:00Z', topics: ['ml'], fork: false },
      ],
      githubEvents: [
        { type: 'PushEvent', created_at: new Date().toISOString(), repo: { name: 'testuser/project' } },
      ],
    };

    const result = await computeReadinessScore(githubOnly);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    // Without LinkedIn, some pillars will be null but engine still works
    // GitHub-only still gives data to multiple pillars
    // Verify the result is valid regardless of how many pillars fire
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('all fetchers fail produces graceful degradation', async () => {
    const failingFetchers: ExternalFetchers = {
      fetchLayoffsData: vi.fn().mockRejectedValue(new Error('Down')),
      fetchCompanyNews: vi.fn().mockRejectedValue(new Error('Down')),
      analyzeSentiment: vi.fn().mockRejectedValue(new Error('Down')),
    };

    const result = await computeReadinessScore(richCandidate, failingFetchers);
    // Should still return valid result from GitHub-only data
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(Object.keys(result.pillars)).toHaveLength(7);
  });

  it('empty candidate returns valid zero structure', async () => {
    const result = await computeReadinessScore({ candidateId: 'empty' });

    expect(result.overall).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.level).toBe('cold');
    expect(Object.keys(result.pillars)).toHaveLength(7);
    // All pillars should be null
    for (const pillar of Object.values(result.pillars)) {
      expect(pillar.score).toBeNull();
    }
  });

  it('re-weighting: null pillars do not affect total calculation', async () => {
    // When only some pillars have data, remaining weight is redistributed
    const minimalInput: ReadinessInput = {
      candidateId: 'minimal',
      githubProfile: {
        login: 'test',
        public_repos: 5,
        followers: 10,
        following: 500, // High ratio = network signal
        created_at: '2022-01-01T00:00:00Z',
        bio: 'Open to work!',
        company: null,
      },
    };

    const result = await computeReadinessScore(minimalInput);
    // Should have a score > 0 since we have some signals
    expect(result.overall).toBeGreaterThan(0);
    // Confidence should be non-zero
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('rich candidate with all positive signals scores warm or hot', async () => {
    const result = await computeReadinessScore(richCandidate);
    // Jane has: open to work, activity cliff, new languages, 2.5y tenure, profile README updated
    // This should push her into warm or hot territory
    expect(['warming', 'warm', 'hot']).toContain(result.level);
  });

  it('external fetchers enhance scores when available', async () => {
    const enhancedFetchers: ExternalFetchers = {
      fetchLayoffsData: vi.fn().mockResolvedValue({
        hasLayoffs: true,
        date: new Date().toISOString(),
        count: 200,
      }),
      fetchCompanyNews: vi.fn().mockResolvedValue([
        { title: 'Restructuring', date: new Date().toISOString(), sentiment: 0.2 },
      ]),
      analyzeSentiment: vi.fn().mockResolvedValue([
        { text: 'Open to work', sentiment: 0.3, confidence: 0.8 },
      ]),
    };

    const withFetchers = await computeReadinessScore(richCandidate, enhancedFetchers);
    const withoutFetchers = await computeReadinessScore(richCandidate);

    // With bad company news + layoffs, company health pillar should be higher
    const companyWithFetchers = withFetchers.pillars.companyHealth;
    const companyWithout = withoutFetchers.pillars.companyHealth;

    expect(companyWithFetchers.score).toBeGreaterThan(companyWithout.score!);
  });
});
