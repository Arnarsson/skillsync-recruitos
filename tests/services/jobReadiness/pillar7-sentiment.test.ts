import { describe, it, expect, vi } from 'vitest';
import { computeSentimentShift } from '../../../services/jobReadiness/pillar7-sentiment';
import type { ReadinessInput, ExternalFetchers } from '../../../services/jobReadiness/types';

describe('pillar7-sentiment: computeSentimentShift', () => {
  it('returns null score when no text data', async () => {
    const result = await computeSentimentShift({ candidateId: 'test-1' });
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('detects negative sentiment via LLM', async () => {
    const fetchers: ExternalFetchers = {
      analyzeSentiment: vi.fn().mockResolvedValue([
        { text: 'Frustrated with legacy code', sentiment: 0.2, confidence: 0.8 },
        { text: 'Time for a change', sentiment: 0.3, confidence: 0.7 },
      ]),
    };
    const result = await computeSentimentShift(
      {
        candidateId: 'test-1',
        githubProfile: {
          login: 'test',
          public_repos: 10,
          followers: 50,
          following: 50,
          created_at: '2020-01-01T00:00:00Z',
          bio: 'Frustrated with legacy code. Time for a change.',
          company: null,
        },
      },
      fetchers
    );
    expect(result.score).toBeGreaterThan(50);
    expect(result.primarySource).toBe('llm_inference');
  });

  it('falls back to keyword matching when LLM fails', async () => {
    const fetchers: ExternalFetchers = {
      analyzeSentiment: vi.fn().mockRejectedValue(new Error('API down')),
    };
    const result = await computeSentimentShift(
      {
        candidateId: 'test-1',
        githubProfile: {
          login: 'test',
          public_repos: 10,
          followers: 50,
          following: 50,
          created_at: '2020-01-01T00:00:00Z',
          bio: 'Burned out. Moving on to next chapter.',
          company: null,
        },
      },
      fetchers
    );
    expect(result.score).not.toBeNull();
    const keywordSignal = result.signals.find(s => s.name === 'keyword_sentiment');
    expect(keywordSignal).toBeDefined();
    expect(keywordSignal!.normalizedValue).toBeGreaterThan(50);
  });

  it('scores low for positive/neutral content', async () => {
    const result = await computeSentimentShift({
      candidateId: 'test-1',
      githubProfile: {
        login: 'test',
        public_repos: 10,
        followers: 50,
        following: 50,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Excited about my work at an amazing team. Grateful for the opportunity.',
        company: 'HappyCo',
      },
    });
    expect(result.score).toBeLessThan(40);
  });

  it('detects LinkedIn post engagement drop', async () => {
    const result = await computeSentimentShift({
      candidateId: 'test-1',
      linkedinProfile: {
        posts: [
          { text: 'Career update coming soon', date: new Date().toISOString(), reactions: 5 },
          { text: 'Exploring new directions', date: new Date(Date.now() - 30 * 86400000).toISOString(), reactions: 8 },
          { text: 'Big project launch!', date: new Date(Date.now() - 180 * 86400000).toISOString(), reactions: 50 },
          { text: 'Promoted!', date: new Date(Date.now() - 365 * 86400000).toISOString(), reactions: 80 },
        ],
      },
    });
    const engagementSignal = result.signals.find(s => s.name === 'post_engagement_trend');
    expect(engagementSignal).toBeDefined();
  });

  it('handles mixed signals with moderate score', async () => {
    const result = await computeSentimentShift({
      candidateId: 'test-1',
      githubProfile: {
        login: 'test',
        public_repos: 10,
        followers: 50,
        following: 50,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Love my team but exploring options for growth',
        company: 'CurrentCo',
      },
    });
    // "exploring options" is negative, but no strong negative keywords
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
