export interface ExplanationFactor {
  label: string;
  direction: "positive" | "negative" | "neutral";
  impact: number;
}

export interface ExplanationEvidence {
  criterion: string;
  observation: string;
  source: string;
  confidence: number;
}

export interface CandidateExplanation {
  conclusion: string;
  confidence: "low" | "medium" | "high";
  topFactors: ExplanationFactor[];
  evidence: ExplanationEvidence[];
  gaps: string[];
  interviewChecks: string[];
  disclaimer: string;
}

interface ExplainabilityInput {
  candidateName?: string;
  keyEvidence?: string[];
  risks?: string[];
  alignmentScore?: number;
  analysisMode: "comparative" | "scoring";
}

function scoreToConfidence(score?: number): "low" | "medium" | "high" {
  if (typeof score !== "number") return "medium";
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function buildCandidateExplanation(
  input: ExplainabilityInput
): CandidateExplanation {
  const positives = (input.keyEvidence || []).slice(0, 3);
  const negatives = (input.risks || []).slice(0, 3);

  const topFactors: ExplanationFactor[] = [
    ...positives.map((label) => ({
      label,
      direction: "positive" as const,
      impact: 70,
    })),
    ...negatives.map((label) => ({
      label,
      direction: "negative" as const,
      impact: 50,
    })),
  ].slice(0, 6);

  const evidence: ExplanationEvidence[] = [
    ...positives.map((observation) => ({
      criterion: "Strength signal",
      observation,
      source: "Public activity evidence",
      confidence: 0.75,
    })),
    ...negatives.map((observation) => ({
      criterion: "Risk signal",
      observation,
      source: "Public activity evidence",
      confidence: 0.65,
    })),
  ];

  const gaps = [
    "Validate soft-skill fit through structured interview questions.",
    "Confirm role-specific depth with live technical discussion.",
  ];

  const interviewChecks = [
    "Ask for one concrete example behind each strong evidence claim.",
    "Probe one potential risk area and request mitigation examples.",
    "Validate collaboration style with prior team-context questions.",
  ];

  return {
    conclusion:
      input.analysisMode === "comparative"
        ? `Behavioral evidence summary generated for ${input.candidateName || "candidate"}.`
        : `Evidence-based recommendation generated for ${input.candidateName || "candidate"}.`,
    confidence: scoreToConfidence(input.alignmentScore),
    topFactors,
    evidence,
    gaps,
    interviewChecks,
    disclaimer:
      "Evidence-informed decision support only. This does not predict personality or guarantee performance.",
  };
}
