import { describe, it, expect } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';
import { Octokit } from '@octokit/rest';
import { computeReadinessScore } from '../../../services/jobReadiness/engine';
import { createExternalFetchers } from '../../../services/jobReadiness/fetchers';
import type { ReadinessInput } from '../../../services/jobReadiness/types';
import { PILLAR_NAMES } from '../../../services/jobReadiness/types';

// Load .env so GITHUB_TOKEN is available in test environment
config({ path: resolve(__dirname, '../../../.env') });

/**
 * Integration test — hits real GitHub API, no mocks, no fake data.
 * Requires GITHUB_TOKEN in .env. Skips gracefully if missing.
 *
 * Tests against a well-known, stable GitHub user (sindresorhus)
 * whose profile structure is unlikely to change drastically.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const TEST_USERNAME = 'sindresorhus'; // prolific OSS dev, stable profile

const describeWithGitHub = GITHUB_TOKEN ? describe : describe.skip;

async function fetchRealCandidate(username: string): Promise<ReadinessInput> {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  const [profileRes, reposRes, eventsRes] = await Promise.all([
    octokit.users.getByUsername({ username }),
    octokit.repos.listForUser({ username, per_page: 30, sort: 'pushed' }),
    octokit.activity.listPublicEventsForUser({ username, per_page: 30 }),
  ]);

  const profile = profileRes.data;
  const repos = reposRes.data;
  const events = eventsRes.data;

  return {
    candidateId: `integration-real-${username}`,
    githubUsername: username,
    currentCompany: profile.company || undefined,
    location: profile.location || undefined,
    githubProfile: {
      login: profile.login,
      public_repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      bio: profile.bio,
      company: profile.company,
    },
    githubRepos: repos.map(r => ({
      name: r.name,
      language: r.language || null,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      pushed_at: r.pushed_at || new Date().toISOString(),
      created_at: r.created_at || new Date().toISOString(),
      topics: r.topics || [],
      fork: r.fork,
    })),
    githubEvents: events.map(e => ({
      type: e.type || 'Unknown',
      created_at: e.created_at || new Date().toISOString(),
      repo: { name: e.repo.name },
    })),
  };
}

describeWithGitHub('Job Readiness Engine — Real GitHub Integration', () => {
  let candidate: ReadinessInput;

  // Fetch real data once for all tests
  it('fetches real candidate data from GitHub API', async () => {
    candidate = await fetchRealCandidate(TEST_USERNAME);

    expect(candidate.githubUsername).toBe(TEST_USERNAME);
    expect(candidate.githubProfile).toBeTruthy();
    expect(candidate.githubProfile!.public_repos).toBeGreaterThan(0);
    expect(candidate.githubRepos!.length).toBeGreaterThan(0);
  }, 15000);

  it('full pipeline produces valid ReadinessScore from real data', async () => {
    if (!candidate) candidate = await fetchRealCandidate(TEST_USERNAME);

    const result = await computeReadinessScore(candidate, createExternalFetchers());

    expect(result.candidateId).toBe(`integration-real-${TEST_USERNAME}`);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.level).toMatch(/^(cold|warming|warm|hot)$/);
    expect(result.computedAt).toBeTruthy();
    expect(result.dataSourcesSummary).toContain('github');
  }, 15000);

  it('real data activates at least 4 pillars', async () => {
    if (!candidate) candidate = await fetchRealCandidate(TEST_USERNAME);

    const result = await computeReadinessScore(candidate);

    const scoredPillars = Object.values(result.pillars).filter(p => p.score !== null);
    // Real GitHub profile with repos + events should activate multiple pillars
    expect(scoredPillars.length).toBeGreaterThanOrEqual(4);
  }, 15000);

  it('all 7 pillar keys are present in result', async () => {
    if (!candidate) candidate = await fetchRealCandidate(TEST_USERNAME);

    const result = await computeReadinessScore(candidate);

    for (const name of PILLAR_NAMES) {
      expect(result.pillars[name]).toBeDefined();
      expect(result.pillars[name].pillar).toBe(name);
    }
  }, 15000);

  it('each scored pillar has at least one signal', async () => {
    if (!candidate) candidate = await fetchRealCandidate(TEST_USERNAME);

    const result = await computeReadinessScore(candidate);

    for (const pillar of Object.values(result.pillars)) {
      if (pillar.score !== null) {
        expect(pillar.signals.length).toBeGreaterThan(0);
        // Every signal must have valid normalizedValue
        for (const signal of pillar.signals) {
          expect(signal.normalizedValue).toBeGreaterThanOrEqual(0);
          expect(signal.normalizedValue).toBeLessThanOrEqual(100);
          expect(signal.confidence).toBeGreaterThan(0);
          expect(signal.confidence).toBeLessThanOrEqual(1);
        }
      }
    }
  }, 15000);

  it('score is deterministic across two runs with same data', async () => {
    if (!candidate) candidate = await fetchRealCandidate(TEST_USERNAME);

    const result1 = await computeReadinessScore(candidate);
    const result2 = await computeReadinessScore(candidate);

    expect(result1.overall).toBe(result2.overall);
    expect(result1.confidence).toBe(result2.confidence);
    expect(result1.level).toBe(result2.level);
  }, 15000);

  it('empty candidate returns zero structure without crashing', async () => {
    const result = await computeReadinessScore({ candidateId: 'empty' });

    expect(result.overall).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.level).toBe('cold');
    expect(Object.keys(result.pillars)).toHaveLength(7);
    for (const pillar of Object.values(result.pillars)) {
      expect(pillar.score).toBeNull();
    }
  });

  it('re-weighting: null pillars redistribute correctly', async () => {
    // Minimal input that only fires a subset of pillars
    const minimal: ReadinessInput = {
      candidateId: 'minimal-reweight',
      githubProfile: {
        login: 'test',
        public_repos: 5,
        followers: 10,
        following: 500,
        created_at: '2022-01-01T00:00:00Z',
        bio: 'Open to work!',
        company: null,
      },
    };

    const result = await computeReadinessScore(minimal);
    const activePillars = Object.values(result.pillars).filter(p => p.score !== null);
    const nullPillars = Object.values(result.pillars).filter(p => p.score === null);

    // Should have some active and some null (partial data)
    expect(activePillars.length).toBeGreaterThan(0);
    expect(nullPillars.length).toBeGreaterThan(0);
    // Score should still be > 0 from the active pillars
    expect(result.overall).toBeGreaterThan(0);
  });
});
