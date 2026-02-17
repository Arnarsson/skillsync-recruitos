import { describe, it, expect } from 'vitest';
import { computeEngagementDecay } from '../../../services/jobReadiness/pillar2-engagement';
import type { ReadinessInput } from '../../../services/jobReadiness/types';

function makeEvents(daysAgo: number[], type = 'PushEvent') {
  return daysAgo.map(d => ({
    type,
    created_at: new Date(Date.now() - d * 86400000).toISOString(),
    repo: { name: 'user/repo' },
  }));
}

describe('pillar2-engagement: computeEngagementDecay', () => {
  it('returns null score when no events available', async () => {
    const result = await computeEngagementDecay({ candidateId: 'test-1' });
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('detects activity cliff (high activity then silence)', async () => {
    const events = makeEvents([60, 62, 65, 68, 70, 72, 75, 78, 80, 85]);
    const result = await computeEngagementDecay({
      candidateId: 'test-1',
      githubEvents: events,
    });
    expect(result.score).toBeGreaterThan(40);
    const cliffSignal = result.signals.find(s => s.name === 'activity_cliff');
    expect(cliffSignal).toBeDefined();
  });

  it('scores low for steady consistent activity', async () => {
    const events = makeEvents([1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]);
    const result = await computeEngagementDecay({
      candidateId: 'test-1',
      githubEvents: events,
    });
    expect(result.score).toBeLessThan(30);
  });

  it('scores high when recent activity drops significantly', async () => {
    const oldActivity = makeEvents([61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75]);
    const recentActivity = makeEvents([5]);
    const result = await computeEngagementDecay({
      candidateId: 'test-1',
      githubEvents: [...oldActivity, ...recentActivity],
    });
    expect(result.score).toBeGreaterThan(40);
  });

  it('considers event type variety in decay detection', async () => {
    const diverseOld = [
      ...makeEvents([70, 72, 74], 'PushEvent'),
      ...makeEvents([71, 73, 75], 'PullRequestEvent'),
      ...makeEvents([76, 77], 'IssuesEvent'),
    ];
    const result = await computeEngagementDecay({
      candidateId: 'test-1',
      githubEvents: diverseOld,
    });
    expect(result.signals.find(s => s.name === 'event_type_diversity')).toBeDefined();
  });

  it('falls back to repo data when no events', async () => {
    const result = await computeEngagementDecay({
      candidateId: 'test-1',
      githubRepos: [
        {
          name: 'old-repo',
          language: 'JavaScript',
          stargazers_count: 10,
          forks_count: 2,
          pushed_at: new Date(Date.now() - 75 * 86400000).toISOString(),
          created_at: '2023-01-01T00:00:00Z',
          topics: [],
          fork: false,
        },
      ],
    });
    expect(result.score).not.toBeNull();
    expect(result.confidence).toBe(0.4);
  });
});
