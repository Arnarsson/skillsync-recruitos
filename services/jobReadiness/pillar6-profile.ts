import type { PillarResult, ReadinessInput, Signal, DataSource } from './types';

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
 * - GitHub profile staleness (stale profile = data unreliable)
 * - Company mismatch between GitHub and LinkedIn (strong transition signal)
 *
 * Fallback: GitHub profile/repos → LinkedIn → null
 */
export async function computeProfileOptimization(
  input: ReadinessInput
): Promise<PillarResult> {
  const signals: Signal[] = [];
  const fallbacksUsed: DataSource[] = [];

  if (!input.githubProfile && !input.githubRepos && !input.linkedinProfile) {
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

  // Signal 5: GitHub profile staleness
  // Stale profile means the person may have moved on — the data we have is unreliable.
  // This signal adjusts the pillar's own confidence, not the readiness score.
  if (input.githubProfile?.updated_at) {
    const daysSinceUpdate = (Date.now() - new Date(input.githubProfile.updated_at).getTime()) / 86400000;
    let stalenessScore: number;
    let stalenessConfidence: number;

    if (daysSinceUpdate < 30) {
      stalenessScore = 10;  // Fresh profile = not a readiness signal
      stalenessConfidence = 0.3;
    } else if (daysSinceUpdate < 90) {
      stalenessScore = 25;
      stalenessConfidence = 0.4;
    } else if (daysSinceUpdate < 180) {
      stalenessScore = 45;  // Getting stale = mild signal
      stalenessConfidence = 0.5;
    } else if (daysSinceUpdate < 365) {
      stalenessScore = 60;  // Stale = person may not use GH anymore
      stalenessConfidence = 0.5;
    } else {
      stalenessScore = 75;  // Very stale = GH is abandoned
      stalenessConfidence = 0.5;
    }

    signals.push({
      name: 'github_staleness',
      value: daysSinceUpdate,
      normalizedValue: stalenessScore,
      source: 'github',
      confidence: stalenessConfidence,
      detail: `GitHub profile last updated ${Math.round(daysSinceUpdate)} days ago`,
    });
  }

  // Signal 6: Company mismatch between GitHub and LinkedIn
  // If GitHub company field doesn't match LinkedIn current role, the person
  // is likely transitioning — very strong readiness signal.
  if (input.githubProfile?.company && input.linkedinProfile?.experience) {
    const githubCompany = input.githubProfile.company.replace(/^@/, '').toLowerCase().trim();
    const currentLinkedIn = input.linkedinProfile.experience.find(e => e.current || !e.endDate);

    if (currentLinkedIn) {
      const linkedinCompany = currentLinkedIn.company.toLowerCase().trim();
      const isMismatch = githubCompany.length > 0 &&
        linkedinCompany.length > 0 &&
        !githubCompany.includes(linkedinCompany) &&
        !linkedinCompany.includes(githubCompany);

      if (isMismatch) {
        signals.push({
          name: 'company_mismatch',
          value: 1,
          normalizedValue: 90,
          source: 'linkedin',
          confidence: 0.85,
          detail: `GitHub: "${input.githubProfile.company}" vs LinkedIn: "${currentLinkedIn.company}" — likely transitioning`,
        });
        fallbacksUsed.push('linkedin');
      }
    }
  }

  // Signal 7: LinkedIn headline keywords
  if (input.linkedinProfile?.headline) {
    const headline = input.linkedinProfile.headline.toLowerCase();
    const seekingKeywords = [
      'open to work', 'looking for', 'seeking', 'available',
      'actively looking', 'open to new', 'job hunting',
    ];
    const matches = seekingKeywords.filter(kw => headline.includes(kw));
    if (matches.length > 0) {
      signals.push({
        name: 'linkedin_seeking_keywords',
        value: matches.length,
        normalizedValue: Math.min(100, matches.length * 60),
        source: 'linkedin',
        confidence: 0.95,
        detail: `LinkedIn headline contains: ${matches.join(', ')}`,
      });
      fallbacksUsed.push('linkedin');
    }
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
  const primarySource: DataSource = signals.some(s => s.source === 'linkedin') ? 'linkedin' : 'github';

  return {
    pillar: 'profileOptimization',
    score,
    confidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
    signals,
    primarySource,
    fallbacksUsed,
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
