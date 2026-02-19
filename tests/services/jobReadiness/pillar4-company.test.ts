import { describe, it, expect, vi } from 'vitest';
import { computeCompanyHealth } from '../../../services/jobReadiness/pillar4-company';
import type { ReadinessInput, ExternalFetchers } from '../../../services/jobReadiness/types';

describe('pillar4-company: computeCompanyHealth', () => {
  it('returns null score when no company info', async () => {
    const result = await computeCompanyHealth({ candidateId: 'test-1' });
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('scores high when company has recent layoffs', async () => {
    const fetchers: ExternalFetchers = {
      fetchLayoffsData: vi.fn().mockResolvedValue({
        hasLayoffs: true,
        date: new Date().toISOString(),
        count: 500,
      }),
    };
    const result = await computeCompanyHealth(
      { candidateId: 'test-1', currentCompany: 'BigTech Inc' },
      fetchers
    );
    expect(result.score).toBeGreaterThan(50);
    const layoffSignal = result.signals.find(s => s.name === 'layoff_data');
    expect(layoffSignal).toBeDefined();
  });

  it('scores low for healthy company', async () => {
    const fetchers: ExternalFetchers = {
      fetchLayoffsData: vi.fn().mockResolvedValue({ hasLayoffs: false }),
      fetchCompanyNews: vi.fn().mockResolvedValue([
        { title: 'Great quarter', date: new Date().toISOString(), sentiment: 0.9 },
      ]),
    };
    const result = await computeCompanyHealth(
      { candidateId: 'test-1', currentCompany: 'HealthyCo' },
      fetchers
    );
    expect(result.score).toBeLessThan(40);
  });

  it('detects negative news sentiment', async () => {
    const fetchers: ExternalFetchers = {
      fetchCompanyNews: vi.fn().mockResolvedValue([
        { title: 'Massive restructuring', date: new Date().toISOString(), sentiment: 0.1 },
        { title: 'CEO resigns', date: new Date().toISOString(), sentiment: 0.2 },
      ]),
    };
    const result = await computeCompanyHealth(
      { candidateId: 'test-1', currentCompany: 'TroubledCo' },
      fetchers
    );
    const newsSignal = result.signals.find(s => s.name === 'news_sentiment');
    expect(newsSignal).toBeDefined();
    expect(newsSignal!.normalizedValue).toBeGreaterThan(50);
  });

  it('gracefully degrades when fetchers fail', async () => {
    const fetchers: ExternalFetchers = {
      fetchLayoffsData: vi.fn().mockRejectedValue(new Error('API down')),
      fetchCompanyNews: vi.fn().mockRejectedValue(new Error('API down')),
    };
    const result = await computeCompanyHealth(
      {
        candidateId: 'test-1',
        currentCompany: 'SomeCo',
        githubProfile: {
          login: 'test',
          public_repos: 10,
          followers: 50,
          following: 50,
          created_at: '2020-01-01T00:00:00Z',
          bio: 'Engineer',
          company: '@SomeCo',
        },
      },
      fetchers
    );
    // Should still return a result from GitHub fallback
    expect(result.score).not.toBeNull();
    expect(result.signals.find(s => s.source === 'github')).toBeDefined();
  });

  it('detects departure signals in bio', async () => {
    const result = await computeCompanyHealth({
      candidateId: 'test-1',
      currentCompany: 'FormerCo',
      githubProfile: {
        login: 'test',
        public_repos: 10,
        followers: 50,
        following: 50,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Formerly at BigCorp, looking for new challenges',
        company: null,
      },
    });
    const departureSignal = result.signals.find(s => s.name === 'departure_signal');
    expect(departureSignal).toBeDefined();
    expect(departureSignal!.normalizedValue).toBe(80);
  });
});
