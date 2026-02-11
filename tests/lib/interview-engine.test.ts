import { describe, expect, it } from "vitest";
import { buildInterviewGuide } from "@/lib/interview-engine";

describe("buildInterviewGuide", () => {
  it("generates criterion-linked questions and rubric", () => {
    const result = buildInterviewGuide(
      [
        { id: "collab", label: "Collaboration", weight: 0.5 },
        { id: "ownership", label: "Ownership", weight: 0.5 },
      ],
      "Jane Doe"
    );

    expect(result.candidateName).toBe("Jane Doe");
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].criterionId).toBe("collab");
    expect(result.questions[0].scoringRubric.length).toBeGreaterThan(0);
  });
});
