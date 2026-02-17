import type { PillarResult, ReadinessInput, Signal, ExternalFetchers } from './types';

/**
 * Pillar 4: Company Health (15%)
 *
 * Detects employer flight risk from external signals:
 * - Company matched against known layoff data
 * - News sentiment about employer
 * - GitHub org membership changes as fallback
 *
 * Fallback: Layoffs.fyi → News API → GitHub org signals → null
 */
export async function computeCompanyHealth(
  input: ReadinessInput,
  fetchers?: ExternalFetchers
): Promise<PillarResult> {
  const signals: Signal[] = [];
  const fallbacksUsed: string[] = [];

  const company = input.currentCompany || input.githubProfile?.company;
  if (!company) {
    return {
      pillar: 'companyHealth',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: [],
    };
  }

  const cleanCompany = company.replace(/^@/, '').trim();

  // Signal 1: Layoffs data (highest priority)
  if (fetchers?.fetchLayoffsData) {
    try {
      const layoffData = await fetchers.fetchLayoffsData(cleanCompany);
      if (layoffData) {
        const layoffScore = layoffData.hasLayoffs ? 85 : 10;
        const recency = layoffData.date
          ? Math.max(0, 1 - (Date.now() - new Date(layoffData.date).getTime()) / (365 * 86400000))
          : 0.5;

        signals.push({
          name: 'layoff_data',
          value: layoffScore,
          normalizedValue: Math.round(layoffScore * recency),
          source: 'layoffs_fyi',
          confidence: 0.9,
          detail: layoffData.hasLayoffs
            ? `${cleanCompany} had layoffs${layoffData.count ? ` (${layoffData.count} affected)` : ''}${layoffData.date ? ` on ${layoffData.date}` : ''}`
            : `No recent layoffs found for ${cleanCompany}`,
        });
      }
    } catch {
      fallbacksUsed.push('layoffs_fyi');
    }
  }

  // Signal 2: News sentiment
  if (fetchers?.fetchCompanyNews) {
    try {
      const news = await fetchers.fetchCompanyNews(cleanCompany);
      if (news && news.length > 0) {
        const avgSentiment = news.reduce((sum, n) => sum + n.sentiment, 0) / news.length;
        // Negative sentiment = higher flight risk score
        const newsScore = Math.round(Math.max(0, Math.min(100, (1 - avgSentiment) * 50 + 25)));

        signals.push({
          name: 'news_sentiment',
          value: avgSentiment,
          normalizedValue: newsScore,
          source: 'news_api',
          confidence: 0.7,
          detail: `Average news sentiment: ${avgSentiment.toFixed(2)} (${news.length} articles)`,
        });
      }
    } catch {
      fallbacksUsed.push('news_api');
    }
  }

  // Signal 3: GitHub org fallback — company field recently changed or removed
  if (input.githubProfile) {
    const hasCompany = !!input.githubProfile.company;
    // If bio mentions "formerly" or "ex-", could indicate recent departure
    const bio = (input.githubProfile.bio || '').toLowerCase();
    const departureKeywords = ['formerly', 'ex-', 'previously at', 'alumni', 'looking for'];
    const hasDepartureSignal = departureKeywords.some(kw => bio.includes(kw));

    if (hasDepartureSignal) {
      signals.push({
        name: 'departure_signal',
        value: 80,
        normalizedValue: 80,
        source: 'github',
        confidence: 0.6,
        detail: `Bio contains departure-related keywords`,
      });
    } else if (!hasCompany) {
      signals.push({
        name: 'no_company_listed',
        value: 40,
        normalizedValue: 40,
        source: 'github',
        confidence: 0.3,
        detail: 'No company listed on GitHub profile',
      });
    } else {
      signals.push({
        name: 'company_listed',
        value: 10,
        normalizedValue: 10,
        source: 'github',
        confidence: 0.3,
        detail: `Company listed: ${input.githubProfile.company}`,
      });
    }
  }

  if (signals.length === 0) {
    return {
      pillar: 'companyHealth',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: fallbacksUsed as any[],
    };
  }

  const score = aggregateSignals(signals);

  return {
    pillar: 'companyHealth',
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
