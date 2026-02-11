import { describe, it, expect } from "vitest";
import { evaluateCriteria } from "@/lib/criteria";

describe("evaluateCriteria", () => {
  it("computes weighted score with confidence and penalty", () => {
    const result = evaluateCriteria(
      [
        { id: "code", label: "Code quality", weight: 0.5 },
        { id: "collab", label: "Collaboration", weight: 0.5 },
      ],
      [
        "Strong code quality in pull requests and clean architecture notes.",
        "Consistent collaboration through review comments and PR feedback.",
      ]
    );

    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.criterionScores).toHaveLength(2);
  });

  it("applies missing data penalty when evidence is absent", () => {
    const result = evaluateCriteria(
      [
        { id: "ownership", label: "Ownership", weight: 1 },
      ],
      []
    );

    expect(result.missingDataPenalty).toBeGreaterThan(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });
});
