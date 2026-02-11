import type { CriterionInput } from "@/lib/criteria";

export interface InterviewGuideQuestion {
  criterionId: string;
  criterionLabel: string;
  question: string;
  whyItMatters: string;
  scoringRubric: Array<{
    score: number;
    signal: string;
  }>;
}

export interface InterviewGuide {
  candidateName?: string;
  generatedAt: string;
  methodologyNote: string;
  questions: InterviewGuideQuestion[];
}

function buildQuestionText(label: string): string {
  return `Can you walk me through a concrete example that demonstrates your ${label.toLowerCase()} in a real project?`;
}

function buildWhyItMatters(label: string): string {
  return `This question validates observable evidence for "${label}" and helps separate demonstrated behavior from self-description.`;
}

function defaultRubric(label: string): InterviewGuideQuestion["scoringRubric"] {
  return [
    { score: 1, signal: `No concrete example related to ${label.toLowerCase()}.` },
    { score: 3, signal: `Provides one relevant example with limited depth or outcomes.` },
    { score: 5, signal: `Provides specific example with clear actions, tradeoffs, and measurable outcome.` },
  ];
}

export function buildInterviewGuide(
  criteria: CriterionInput[],
  candidateName?: string
): InterviewGuide {
  const questions = criteria.map((criterion) => ({
    criterionId: criterion.id,
    criterionLabel: criterion.label,
    question: buildQuestionText(criterion.label),
    whyItMatters: buildWhyItMatters(criterion.label),
    scoringRubric:
      criterion.rubric?.map((r) => ({ score: r.score, signal: r.description })) ||
      defaultRubric(criterion.label),
  }));

  return {
    candidateName,
    generatedAt: new Date().toISOString(),
    methodologyNote:
      "Interview guide generated from predefined criteria for evidence-based candidate evaluation.",
    questions,
  };
}
