export interface RubricItem {
  score: number;
  description: string;
}

export interface CriterionInput {
  id: string;
  label: string;
  weight: number;
  description?: string;
  rubric?: RubricItem[];
}

export interface CriterionScore {
  criterionId: string;
  label: string;
  score: number;
  weightedScore: number;
  confidence: number;
  matchedEvidence: string[];
}

export interface CriteriaScoreResult {
  totalScore: number;
  confidence: number;
  missingDataPenalty: number;
  criterionScores: CriterionScore[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeWeights(criteria: CriterionInput[]): CriterionInput[] {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (total <= 0) {
    const even = 1 / criteria.length;
    return criteria.map((c) => ({ ...c, weight: even }));
  }
  return criteria.map((c) => ({ ...c, weight: c.weight / total }));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter(Boolean);
}

function scoreCriterion(criterion: CriterionInput, evidenceCorpus: string[]): CriterionScore {
  const criterionTokens = tokenize(`${criterion.label} ${criterion.description || ""}`);
  const matches: string[] = [];

  for (const evidence of evidenceCorpus) {
    const evidenceLower = evidence.toLowerCase();
    if (criterionTokens.some((token) => token.length > 3 && evidenceLower.includes(token))) {
      matches.push(evidence);
    }
  }

  const rawMatchRatio =
    criterionTokens.length > 0
      ? clamp(matches.length / Math.max(criterionTokens.length / 2, 1), 0, 1)
      : 0;

  const score = Math.round(clamp(rawMatchRatio * 5, 1, 5));
  const confidence = clamp(0.4 + rawMatchRatio * 0.6, 0.4, 1);

  return {
    criterionId: criterion.id,
    label: criterion.label,
    score,
    weightedScore: score * criterion.weight,
    confidence,
    matchedEvidence: matches.slice(0, 5),
  };
}

export function evaluateCriteria(
  criteria: CriterionInput[],
  evidenceTexts: string[]
): CriteriaScoreResult {
  const normalized = normalizeWeights(criteria);
  const evidenceCorpus = evidenceTexts.filter(Boolean);

  const criterionScores = normalized.map((criterion) =>
    scoreCriterion(criterion, evidenceCorpus)
  );

  const weightedRaw = criterionScores.reduce((sum, c) => sum + c.weightedScore, 0); // 1..5 scale
  const scaledScore = clamp((weightedRaw / 5) * 100, 0, 100);

  const averageConfidence =
    criterionScores.length > 0
      ? criterionScores.reduce((sum, c) => sum + c.confidence, 0) / criterionScores.length
      : 0;

  const lowEvidenceCriteria = criterionScores.filter((c) => c.matchedEvidence.length === 0).length;
  const missingDataPenalty = clamp(lowEvidenceCriteria * 4, 0, 20);

  return {
    totalScore: Math.round(clamp(scaledScore - missingDataPenalty, 0, 100)),
    confidence: Number(averageConfidence.toFixed(2)),
    missingDataPenalty,
    criterionScores,
  };
}
