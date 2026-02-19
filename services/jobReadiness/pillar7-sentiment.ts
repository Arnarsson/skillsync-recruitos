import type { PillarResult, ReadinessInput, Signal, ExternalFetchers } from './types';

/**
 * Pillar 7: Sentiment Shift (5%)
 *
 * NLP-based tone analysis of recent public writing.
 * Detects frustration, career-transition language, or disengagement.
 *
 * Key signals:
 * - GitHub commit messages trending negative/frustrated
 * - LinkedIn posts with career-transition language
 * - LLM inference for nuanced analysis (via OpenRouter)
 *
 * Fallback: LLM analysis → keyword matching → null
 */
export async function computeSentimentShift(
  input: ReadinessInput,
  fetchers?: ExternalFetchers
): Promise<PillarResult> {
  const signals: Signal[] = [];
  const fallbacksUsed: string[] = [];

  // Collect available text sources
  const texts: string[] = [];

  // Source 1: LinkedIn posts
  if (input.linkedinProfile?.posts) {
    texts.push(...input.linkedinProfile.posts.map(p => p.text));
  }

  // Source 2: GitHub commit messages from events
  if (input.githubEvents) {
    // PushEvents may contain commit messages in the payload
    // For now, we use event types as a proxy
  }

  // Source 3: GitHub bio
  if (input.githubProfile?.bio) {
    texts.push(input.githubProfile.bio);
  }

  if (texts.length === 0 && !input.githubEvents) {
    return {
      pillar: 'sentimentShift',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: [],
    };
  }

  // Try LLM-based sentiment analysis first
  if (texts.length > 0 && fetchers?.analyzeSentiment) {
    try {
      const sentimentResults = await fetchers.analyzeSentiment(texts);
      if (sentimentResults && sentimentResults.length > 0) {
        const avgSentiment = sentimentResults.reduce((sum, r) => sum + r.sentiment, 0) / sentimentResults.length;
        const avgConfidence = sentimentResults.reduce((sum, r) => sum + r.confidence, 0) / sentimentResults.length;

        // Lower sentiment = more negative = higher transition signal
        const sentimentScore = Math.round(Math.max(0, Math.min(100, (1 - avgSentiment) * 100)));

        signals.push({
          name: 'llm_sentiment',
          value: avgSentiment,
          normalizedValue: sentimentScore,
          source: 'llm_inference',
          confidence: avgConfidence * 0.8,
          detail: `LLM sentiment analysis: ${avgSentiment.toFixed(2)} avg across ${sentimentResults.length} texts`,
        });

        const score = aggregateSignals(signals);
        return {
          pillar: 'sentimentShift',
          score,
          confidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
          signals,
          primarySource: 'llm_inference',
          fallbacksUsed: [],
        };
      }
    } catch {
      fallbacksUsed.push('llm_inference');
    }
  }

  // Fallback: Keyword-based sentiment from bio and any available text
  if (texts.length > 0) {
    const allText = texts.join(' ').toLowerCase();

    // Negative/transition keywords
    const negativeKeywords = [
      'frustrated', 'burnout', 'burned out', 'tired of', 'done with',
      'leaving', 'moving on', 'next chapter', 'new beginnings',
      'time for a change', 'exploring options', 'open to',
    ];
    const positiveKeywords = [
      'excited about', 'love my', 'grateful', 'amazing team',
      'great company', 'proud to', 'thrilled',
    ];

    const negativeMatches = negativeKeywords.filter(kw => allText.includes(kw));
    const positiveMatches = positiveKeywords.filter(kw => allText.includes(kw));

    const netNegative = negativeMatches.length - positiveMatches.length;
    const keywordScore = Math.max(0, Math.min(100, 50 + netNegative * 25));

    signals.push({
      name: 'keyword_sentiment',
      value: netNegative,
      normalizedValue: keywordScore,
      source: 'github',
      confidence: 0.4,
      detail: negativeMatches.length > 0
        ? `Negative keywords found: ${negativeMatches.join(', ')}`
        : positiveMatches.length > 0
          ? `Positive keywords found: ${positiveMatches.join(', ')}`
          : 'No strong sentiment keywords detected',
    });
  }

  // LinkedIn post engagement drop (if posts available)
  if (input.linkedinProfile?.posts && input.linkedinProfile.posts.length >= 2) {
    const sorted = [...input.linkedinProfile.posts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const recent = sorted.slice(0, Math.ceil(sorted.length / 2));
    const older = sorted.slice(Math.ceil(sorted.length / 2));

    const recentAvg = recent.reduce((s, p) => s + p.reactions, 0) / recent.length;
    const olderAvg = older.reduce((s, p) => s + p.reactions, 0) / older.length;

    if (olderAvg > 0) {
      const engagementChange = (recentAvg - olderAvg) / olderAvg;
      // Dropping engagement might mean content shift (career topics)
      const engScore = engagementChange < -0.3 ? 60 : engagementChange > 0.3 ? 20 : 40;

      signals.push({
        name: 'post_engagement_trend',
        value: engagementChange,
        normalizedValue: engScore,
        source: 'linkedin',
        confidence: 0.5,
        detail: `Post engagement ${engagementChange > 0 ? 'up' : 'down'} ${Math.abs(engagementChange * 100).toFixed(0)}%`,
      });
    }
  }

  if (signals.length === 0) {
    return {
      pillar: 'sentimentShift',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: fallbacksUsed as any[],
    };
  }

  const score = aggregateSignals(signals);

  return {
    pillar: 'sentimentShift',
    score,
    confidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
    signals,
    primarySource: signals[0].source,
    fallbacksUsed: fallbacksUsed as any[],
  };
}

function aggregateSignals(signals: Signal[]): number {
  if (signals.length === 0) return 0;
  const weightedSum = signals.reduce(
    (sum, s) => sum + s.normalizedValue * s.confidence,
    0
  );
  const weightSum = signals.reduce((sum, s) => sum + s.confidence, 0);
  return Math.min(100, Math.round(weightedSum / weightSum));
}
