"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useLanguage } from "@/lib/i18n";

const HIDDEN_ROUTES = new Set(["/", "/login", "/signup"]);
const HIDDEN_PREFIXES = ["/api", "/report/", "/embed/profile/"];

const LABELS: Record<string, string> = {
  intake: "breadcrumbs.intake",
  "skills-review": "breadcrumbs.skillsReview",
  pipeline: "breadcrumbs.pipeline",
  analyse: "breadcrumbs.deepDive",
  compare: "breadcrumbs.compare",
  graph: "breadcrumbs.talentGraph",
  search: "breadcrumbs.search",
  dashboard: "breadcrumbs.dashboard",
  settings: "breadcrumbs.settings",
  criteria: "breadcrumbs.criteria",
  "linkedin-captures": "breadcrumbs.linkedinCaptures",
  "linkedin-pipeline": "breadcrumbs.linkedinPipeline",
  "network-map": "breadcrumbs.linkedinNetwork",
  analytics: "breadcrumbs.analytics",
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function segmentLabel(segment: string, t: (key: string) => string): string {
  if (LABELS[segment]) return t(LABELS[segment]);
  if (isUuid(segment)) return t("breadcrumbs.detail");
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function GlobalBreadcrumbs() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = useMemo(() => {
    if (!pathname) return [];
    if (HIDDEN_ROUTES.has(pathname)) return [];
    if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return [];

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [];

    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const isLast = index === segments.length - 1;
      return {
        label: segmentLabel(segment, t),
        href: isLast ? undefined : href,
      };
    });
  }, [pathname, t]);

  if (items.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-16 sm:pt-[4.25rem]">
      <Breadcrumbs items={items} />
    </div>
  );
}
