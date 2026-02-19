import type { PillarResult, ReadinessInput, Signal } from './types';

/**
 * Pillar 6: Profile Optimization (10%)
 *
 * Detects "resume polishing" behavior — updating profiles signals job seeking.
 *
 * Key signals:
 * - GitHub profile README recently updated
 * - Bio contains job-seeking keywords
 * - Personal website/blog repo recently pushed
 * - Profile completeness (filled in bio, company, location, etc.)
 *
 * Fallback: GitHub profile/repos → null
 */
export async function computeProfileOptimization(
  input: ReadinessInput
): Promise<PillarResult> {
  const signals: Signal[] = [];

  if (!input.githubProfile && !input.githubRepos) {
    return {
      pillar: 'profileOptimization',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: [],
    };
  }

  // Signal 1: Job-seeking keywords in bio
  if (input.githubProfile?.bio) {
    const bio = input.githubProfile.bio.toLowerCase();
    const seekingKeywords = [
      'open to work', 'looking for', 'seeking', 'available for',
      'open for opportunities', 'job hunting', 'on the market',
      'freelance', 'for hire', 'looking for opportunities',
      'actively looking', 'open to new',
    ];
    const matches = seekingKeywords.filter(kw => bio.includes(kw));
    const seekingScore = Math.min(100, matches.length * 50);

    signals.push({
      name: 'seeking_keywords',
      value: matches.length,
      normalizedValue: seekingScore,
      source: 'github',
      confidence: matches.length > 0 ? 0.9 : 0.3,
      detail: matches.length > 0
        ? `Bio contains: ${matches.join(', ')}`
        : 'No job-seeking keywords in bio',
    });
  }

  // Signal 2: Profile README repo recently updated
  if (input.githubRepos && input.githubUsername) {
    const readmeRepo = input.githubRepos.find(
      r => r.name.toLowerCase() === input.githubUsername!.toLowerCase()
    );
    if (readmeRepo) {
      const daysSincePush = (Date.now() - new Date(readmeRepo.pushed_at).getTime()) / 86400000;
      // Recently updated README = polishing profile
      let readmeScore: number;
      if (daysSincePush < 7) readmeScore = 100;
      else if (daysSincePush < 30) readmeScore = 70;
      else if (daysSincePush < 90) readmeScore = 30;
      else readmeScore = 5;

      signals.push({
        name: 'readme_freshness',
        value: daysSincePush,
        normalizedValue: readmeScore,
        source: 'github',
        confidence: 0.8,
        detail: `Profile README updated ${Math.round(daysSincePush)} days ago`,
      });
    }
  }

  // Signal 3: Personal website/blog repo activity
  if (input.githubRepos) {
    const websitePatterns = [
      /\.github\.io$/i, /portfolio/i, /personal.*site/i,
      /blog/i, /resume/i, /cv$/i, /website/i,
    ];
    const websiteRepos = input.githubRepos.filter(r =>
      websitePatterns.some(p => p.test(r.name))
    );

    if (websiteRepos.length > 0) {
      const mostRecent = websiteRepos.reduce((latest, r) =>
        new Date(r.pushed_at) > new Date(latest.pushed_at) ? r : latest
      );
      const daysSincePush = (Date.now() - new Date(mostRecent.pushed_at).getTime()) / 86400000;
      let siteScore: number;
      if (daysSincePush < 14) siteScore = 90;
      else if (daysSincePush < 60) siteScore = 50;
      else if (daysSincePush < 180) siteScore = 20;
      else siteScore = 5;

      signals.push({
        name: 'website_activity',
        value: daysSincePush,
        normalizedValue: siteScore,
        source: 'github',
        confidence: 0.7,
        detail: `Website/portfolio repo "${mostRecent.name}" updated ${Math.round(daysSincePush)} days ago`,
      });
    }
  }

  // Signal 4: Profile completeness
  if (input.githubProfile) {
    const p = input.githubProfile;
    let completeness = 0;
    if (p.bio) completeness++;
    if (p.company) completeness++;
    if (input.location) completeness++;
    if (p.public_repos > 0) completeness++;
    // 4/4 = fully polished profile
    const completenessScore = Math.round((completeness / 4) * 60);

    signals.push({
      name: 'profile_completeness',
      value: completeness,
      normalizedValue: completenessScore,
      source: 'github',
      confidence: 0.4,
      detail: `Profile completeness: ${completeness}/4 fields filled`,
    });
  }

  if (signals.length === 0) {
    return {
      pillar: 'profileOptimization',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: [],
    };
  }

  const score = aggregateSignals(signals);

  return {
    pillar: 'profileOptimization',
    score,
    confidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
    signals,
    primarySource: 'github',
    fallbacksUsed: [],
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
