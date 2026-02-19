import type { PillarResult, ReadinessInput, Signal } from './types';

/**
 * Pillar 5: Tenure Risk (10%)
 *
 * Career stage analysis — 2-3 years at current company = peak job-change probability.
 * The "itch" curve: mobility peaks around 2-3 years, drops significantly after 5+.
 *
 * Key signals:
 * - Years at current company (bell curve: peak at 2-3 years)
 * - Career stage (mid-level more mobile than senior/junior)
 * - Historical tenure pattern from LinkedIn
 *
 * Fallback: LinkedIn work history → yearsAtCompany field → GitHub org duration → null
 */
export async function computeTenureRisk(
  input: ReadinessInput
): Promise<PillarResult> {
  const signals: Signal[] = [];
  const fallbacksUsed: string[] = [];

  // Try LinkedIn first for most accurate tenure data
  if (input.linkedinProfile?.experience) {
    const currentJob = input.linkedinProfile.experience.find(e => e.current || !e.endDate);
    if (currentJob?.startDate) {
      const years = yearsFromDate(currentJob.startDate);
      const tenureScore = tenureBellCurve(years);
      signals.push({
        name: 'linkedin_tenure',
        value: years,
        normalizedValue: tenureScore,
        source: 'linkedin',
        confidence: 0.9,
        detail: `${years.toFixed(1)} years at ${currentJob.company} (LinkedIn)`,
      });

      // Bonus: historical pattern — short tenures across jobs
      const completedJobs = input.linkedinProfile.experience.filter(
        e => e.startDate && e.endDate
      );
      if (completedJobs.length >= 2) {
        const tenures = completedJobs.map(j => {
          const start = new Date(j.startDate!).getTime();
          const end = new Date(j.endDate!).getTime();
          return (end - start) / (365.25 * 86400000);
        });
        const avgTenure = tenures.reduce((a, b) => a + b, 0) / tenures.length;
        // Short average tenure = job hopper = higher mobility signal
        const hopperScore = avgTenure < 2 ? 80 : avgTenure < 3 ? 60 : avgTenure < 5 ? 30 : 10;

        signals.push({
          name: 'tenure_pattern',
          value: avgTenure,
          normalizedValue: hopperScore,
          source: 'linkedin',
          confidence: 0.7,
          detail: `Average past tenure: ${avgTenure.toFixed(1)} years across ${completedJobs.length} roles`,
        });
      }

      const score = aggregateSignals(signals);
      return {
        pillar: 'tenureRisk',
        score,
        confidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
        signals,
        primarySource: 'linkedin',
        fallbacksUsed: [],
      };
    }
  }

  // Fallback: yearsAtCompany field
  if (input.yearsAtCompany !== undefined) {
    const tenureScore = tenureBellCurve(input.yearsAtCompany);
    signals.push({
      name: 'provided_tenure',
      value: input.yearsAtCompany,
      normalizedValue: tenureScore,
      source: 'github',
      confidence: 0.6,
      detail: `${input.yearsAtCompany} years at current company (provided)`,
    });
    fallbacksUsed.push('linkedin');
  }

  // Fallback: GitHub account age as very rough proxy
  if (signals.length === 0 && input.githubProfile) {
    const accountAge = yearsFromDate(input.githubProfile.created_at);
    // Very rough: if account is 2-4 years old, might be at peak mobility
    // This is low-confidence
    const roughScore = tenureBellCurve(accountAge * 0.7); // discount factor
    signals.push({
      name: 'github_account_age',
      value: accountAge,
      normalizedValue: roughScore,
      source: 'github',
      confidence: 0.2,
      detail: `GitHub account age: ${accountAge.toFixed(1)} years (rough proxy)`,
    });
    fallbacksUsed.push('linkedin');
  }

  if (signals.length === 0) {
    return {
      pillar: 'tenureRisk',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: [],
    };
  }

  const score = aggregateSignals(signals);

  return {
    pillar: 'tenureRisk',
    score,
    confidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
    signals,
    primarySource: signals[0].source,
    fallbacksUsed: fallbacksUsed as any[],
  };
}

/**
 * Bell curve peaking at 2-3 years.
 * - 0-0.5 years: very low (too new)
 * - 0.5-1.5 years: rising
 * - 1.5-3.5 years: peak (75-100)
 * - 3.5-5 years: declining
 * - 5+ years: low (settled)
 */
function tenureBellCurve(years: number): number {
  if (years < 0.5) return 10;
  if (years < 1.5) return Math.round(10 + (years - 0.5) * 65); // 10 → 75
  if (years < 2.5) return Math.round(75 + (years - 1.5) * 25); // 75 → 100
  if (years < 3.5) return Math.round(100 - (years - 2.5) * 25); // 100 → 75
  if (years < 5) return Math.round(75 - (years - 3.5) * 40); // 75 → 15
  if (years < 8) return Math.round(15 - (years - 5) * 3); // 15 → 6
  return 5;
}

function yearsFromDate(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (365.25 * 86400000);
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
