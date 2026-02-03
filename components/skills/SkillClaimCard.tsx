import type { SkillClaim } from "@/types/skillClaims";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EvidenceLink } from "@/components/EvidenceLink";

function levelLabel(level: SkillClaim["level"]) {
  if (level === "strong") return "Strong";
  if (level === "moderate") return "Moderate";
  return "Weak";
}

function formatConfidence(confidence: number) {
  const pct = Math.round((confidence || 0) * 100);
  return `${pct}% conf`;
}

export function SkillClaimCard({ claim }: { claim: SkillClaim }) {
  const evidenceCount = claim.evidence?.length ?? 0;

  return (
    <Card className="border-muted">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold truncate">{claim.skill}</span>
              <Badge variant="secondary" className="text-[10px]">
                {levelLabel(claim.level)}
              </Badge>
              <span className="text-xs text-muted-foreground">[{formatConfidence(claim.confidence)}]</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Evidence: {evidenceCount} link{evidenceCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {evidenceCount > 0 && (
          <div className="mt-3 space-y-1 border-t border-muted pt-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Evidence ({evidenceCount} {evidenceCount === 1 ? 'link' : 'links'}):
            </div>
            {claim.evidence.slice(0, 3).map((ev) => (
              <EvidenceLink
                key={ev.url}
                type={ev.type}
                url={ev.url}
                title={ev.title}
                snippet={ev.snippet}
              />
            ))}
            {evidenceCount > 3 && (
              <div className="text-xs text-muted-foreground pt-1 pl-2">
                + {evidenceCount - 3} more...
              </div>
            )}
          </div>
        )}

        <div className="mt-3 text-sm">
          <span className="text-muted-foreground">Why:</span> {claim.why_it_counts}
        </div>
      </CardContent>
    </Card>
  );
}
