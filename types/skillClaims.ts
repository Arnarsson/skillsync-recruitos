export interface EvidenceLink {
  type: "repo" | "pr" | "commit" | "file" | "issue";
  url: string;
  title: string;
  snippet?: string;
  date?: Date;
}

export interface SkillClaim {
  skill: string;
  level: "strong" | "moderate" | "weak";
  evidence: EvidenceLink[];
  /** Short rationale */
  why_it_counts: string;
  /** 0-1 */
  confidence: number;
  timestamp?: Date;
}
