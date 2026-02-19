import { describe, it, expect } from 'vitest';
import { computeSkillDiversification } from '../../../services/jobReadiness/pillar3-skills';
import type { ReadinessInput } from '../../../services/jobReadiness/types';

const now = Date.now();

function makeRepo(overrides: Partial<ReadinessInput['githubRepos']![0]> = {}) {
  return {
    name: 'test-repo',
    language: 'JavaScript',
    stargazers_count: 5,
    forks_count: 1,
    pushed_at: new Date().toISOString(),
    created_at: new Date(now - 365 * 86400000).toISOString(),
    topics: [],
    fork: false,
    ...overrides,
  };
}

describe('pillar3-skills: computeSkillDiversification', () => {
  it('returns null score when no repos available', async () => {
    const result = await computeSkillDiversification({ candidateId: 'test-1' });
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('scores low when all repos use same language', async () => {
    const repos = Array(5).fill(null).map((_, i) =>
      makeRepo({
        name: `repo-${i}`,
        language: 'JavaScript',
        pushed_at: new Date(now - i * 30 * 86400000).toISOString(),
        created_at: new Date(now - 400 * 86400000).toISOString(),
      })
    );
    const result = await computeSkillDiversification({
      candidateId: 'test-1',
      githubRepos: repos,
    });
    const newLangSignal = result.signals.find(s => s.name === 'new_languages');
    // All repos pushed recently with same language = no NEW languages (but some recent repos exist)
    // The signal checks recent vs older repos. When all are pushed recently, there are no "older" repos
    // to compare against, so new_languages.value will be the count of languages in recent repos
    expect(newLangSignal).toBeDefined();
    expect(result.score).toBeLessThan(50);
  });

  it('scores high when recent repos have new languages', async () => {
    const repos = [
      // Old repos: only JavaScript
      makeRepo({ name: 'old-1', language: 'JavaScript', pushed_at: new Date(now - 365 * 86400000).toISOString() }),
      makeRepo({ name: 'old-2', language: 'JavaScript', pushed_at: new Date(now - 300 * 86400000).toISOString() }),
      // Recent repos: Rust, Go, Python (3 new languages!)
      makeRepo({ name: 'new-1', language: 'Rust', pushed_at: new Date(now - 10 * 86400000).toISOString() }),
      makeRepo({ name: 'new-2', language: 'Go', pushed_at: new Date(now - 20 * 86400000).toISOString() }),
      makeRepo({ name: 'new-3', language: 'Python', pushed_at: new Date(now - 30 * 86400000).toISOString() }),
    ];
    const result = await computeSkillDiversification({
      candidateId: 'test-1',
      githubRepos: repos,
    });
    const newLangSignal = result.signals.find(s => s.name === 'new_languages');
    expect(newLangSignal).toBeDefined();
    expect(newLangSignal!.value).toBe(3);
    expect(result.score).toBeGreaterThan(40);
  });

  it('detects topic expansion', async () => {
    const repos = [
      makeRepo({ name: 'old', topics: ['web', 'frontend'], pushed_at: new Date(now - 365 * 86400000).toISOString() }),
      makeRepo({ name: 'new', topics: ['web', 'frontend', 'machine-learning', 'ai'], pushed_at: new Date(now - 10 * 86400000).toISOString() }),
    ];
    const result = await computeSkillDiversification({
      candidateId: 'test-1',
      githubRepos: repos,
    });
    const topicSignal = result.signals.find(s => s.name === 'topic_expansion');
    expect(topicSignal).toBeDefined();
    expect(topicSignal!.value).toBeGreaterThan(0);
  });

  it('caps score at 100', async () => {
    const repos = Array(20).fill(null).map((_, i) =>
      makeRepo({
        name: `repo-${i}`,
        language: `Language${i}`,
        pushed_at: new Date(now - i * 5 * 86400000).toISOString(),
        created_at: new Date(now - 30 * 86400000).toISOString(),
        topics: [`topic-${i}`, `topic-${i + 20}`],
      })
    );
    const result = await computeSkillDiversification({
      candidateId: 'test-1',
      githubRepos: repos,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('falls back to LinkedIn skills', async () => {
    const result = await computeSkillDiversification({
      candidateId: 'test-1',
      linkedinProfile: {
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Docker'],
      },
    });
    expect(result.score).not.toBeNull();
    expect(result.primarySource).toBe('linkedin');
  });
});
