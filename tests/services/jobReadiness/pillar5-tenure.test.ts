import { describe, it, expect } from 'vitest';
import { computeTenureRisk } from '../../../services/jobReadiness/pillar5-tenure';
import type { ReadinessInput } from '../../../services/jobReadiness/types';

describe('pillar5-tenure: computeTenureRisk', () => {
  it('returns null score when no tenure data', async () => {
    const result = await computeTenureRisk({ candidateId: 'test-1' });
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('scores high at 2.5 years (peak mobility)', async () => {
    const twoAndHalfYearsAgo = new Date();
    twoAndHalfYearsAgo.setFullYear(twoAndHalfYearsAgo.getFullYear() - 2);
    twoAndHalfYearsAgo.setMonth(twoAndHalfYearsAgo.getMonth() - 6);

    const result = await computeTenureRisk({
      candidateId: 'test-1',
      linkedinProfile: {
        experience: [{
          title: 'Senior Engineer',
          company: 'CurrentCo',
          startDate: twoAndHalfYearsAgo.toISOString(),
          current: true,
        }],
      },
    });
    expect(result.score).toBeGreaterThan(70);
  });

  it('scores low at 6 months (too new)', async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await computeTenureRisk({
      candidateId: 'test-1',
      linkedinProfile: {
        experience: [{
          title: 'Engineer',
          company: 'NewCo',
          startDate: sixMonthsAgo.toISOString(),
          current: true,
        }],
      },
    });
    expect(result.score).toBeLessThan(30);
  });

  it('scores low at 8 years (settled)', async () => {
    const eightYearsAgo = new Date();
    eightYearsAgo.setFullYear(eightYearsAgo.getFullYear() - 8);

    const result = await computeTenureRisk({
      candidateId: 'test-1',
      linkedinProfile: {
        experience: [{
          title: 'Staff Engineer',
          company: 'SettledCo',
          startDate: eightYearsAgo.toISOString(),
          current: true,
        }],
      },
    });
    expect(result.score).toBeLessThan(20);
  });

  it('detects job hopper pattern from history', async () => {
    const result = await computeTenureRisk({
      candidateId: 'test-1',
      linkedinProfile: {
        experience: [
          {
            title: 'Engineer',
            company: 'CurrentCo',
            startDate: new Date(Date.now() - 365 * 86400000).toISOString(),
            current: true,
          },
          {
            title: 'Engineer',
            company: 'PrevCo1',
            startDate: '2023-01-01',
            endDate: '2024-06-01',
          },
          {
            title: 'Junior Dev',
            company: 'PrevCo2',
            startDate: '2021-06-01',
            endDate: '2022-12-01',
          },
        ],
      },
    });
    const patternSignal = result.signals.find(s => s.name === 'tenure_pattern');
    expect(patternSignal).toBeDefined();
    expect(patternSignal!.normalizedValue).toBeGreaterThan(50); // short tenure pattern
  });

  it('falls back to yearsAtCompany field', async () => {
    const result = await computeTenureRisk({
      candidateId: 'test-1',
      yearsAtCompany: 2.5,
    });
    expect(result.score).not.toBeNull();
    expect(result.score).toBeGreaterThan(70);
  });

  it('falls back to GitHub account age as rough proxy', async () => {
    const result = await computeTenureRisk({
      candidateId: 'test-1',
      githubProfile: {
        login: 'test',
        public_repos: 10,
        followers: 50,
        following: 50,
        created_at: new Date(Date.now() - 3 * 365 * 86400000).toISOString(),
        bio: null,
        company: null,
      },
    });
    expect(result.score).not.toBeNull();
    expect(result.confidence).toBeLessThan(0.5); // low confidence for rough proxy
  });
});
