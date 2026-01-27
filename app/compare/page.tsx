import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "RecruitOS vs Traditional Recruiting Tools — Technical Recruiting Comparison",
  description:
    "Compare RecruitOS with LinkedIn Recruiter, Indeed, and traditional recruiting platforms. See how GitHub-based technical assessment differs from resume screening and keyword matching.",
  keywords: [
    "RecruitOS vs LinkedIn Recruiter",
    "technical recruiting comparison",
    "GitHub recruiting tools",
    "recruiting software comparison",
    "developer hiring platforms",
  ],
};

const articleStructuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "RecruitOS vs Traditional Recruiting Tools",
  description:
    "Comprehensive comparison of RecruitOS GitHub-based recruiting with traditional platforms like LinkedIn Recruiter and Indeed.",
  author: {
    "@type": "Organization",
    name: "RecruitOS",
    url: "https://recruitos.dev",
  },
  publisher: {
    "@type": "Organization",
    name: "RecruitOS",
    logo: {
      "@type": "ImageObject",
      url: "https://recruitos.dev/logo.png",
    },
  },
  datePublished: "2025-01-27",
  dateModified: "2025-01-27",
};

interface ComparisonRow {
  feature: string;
  recruitos: boolean | string;
  linkedin: boolean | string;
  indeed: boolean | string;
  description?: string;
}

const comparisons: ComparisonRow[] = [
  {
    feature: "GitHub code analysis",
    recruitos: true,
    linkedin: false,
    indeed: false,
    description: "Evaluates actual code contributions and project work",
  },
  {
    feature: "Resume screening",
    recruitos: "Secondary",
    linkedin: "Primary",
    indeed: "Primary",
    description: "How much the platform relies on self-reported experience",
  },
  {
    feature: "Technical depth assessment",
    recruitos: true,
    linkedin: false,
    indeed: false,
    description: "Analyzes code quality and complexity",
  },
  {
    feature: "Open source discovery",
    recruitos: true,
    linkedin: false,
    indeed: false,
    description: "Finds developers through their public contributions",
  },
  {
    feature: "Skill verification",
    recruitos: "Code-based",
    linkedin: "Self-reported",
    indeed: "Self-reported",
    description: "How skills are validated",
  },
  {
    feature: "Price per month",
    recruitos: "$499",
    linkedin: "$170",
    indeed: "$299",
    description: "Starting price per user per month",
  },
  {
    feature: "Focus area",
    recruitos: "Technical roles",
    linkedin: "All roles",
    indeed: "All roles",
    description: "Platform specialization",
  },
  {
    feature: "Candidate database",
    recruitos: "GitHub users",
    linkedin: "LinkedIn profiles",
    indeed: "Resume database",
    description: "Source of candidates",
  },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-5 h-5 text-green-500 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export default function ComparePage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData),
        }}
      />

      <div className="min-h-screen bg-background py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-12 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Header */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-light mb-4">
              RecruitOS vs Traditional Recruiting Platforms
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              How GitHub-based technical recruiting differs from resume screening and
              keyword matching. A comprehensive comparison of RecruitOS with LinkedIn
              Recruiter, Indeed, and traditional hiring tools.
            </p>
          </div>

          {/* Key Insight */}
          <div className="mb-12 p-6 rounded-lg border border-primary/20 bg-primary/5">
            <h2 className="text-xl font-medium mb-3">The Fundamental Difference</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Traditional platforms</strong> show
              you what candidates <em>claim</em> they can do.{" "}
              <strong className="text-foreground">RecruitOS</strong> shows you what
              they've <em>actually built</em>. This distinction matters most for
              technical roles where code contributions provide objective evidence of
              skill.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="mb-16 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 font-medium">RecruitOS</th>
                  <th className="text-center py-4 px-4 font-medium text-muted-foreground">
                    LinkedIn Recruiter
                  </th>
                  <th className="text-center py-4 px-4 font-medium text-muted-foreground">
                    Indeed
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium mb-1">{row.feature}</div>
                        {row.description && (
                          <div className="text-sm text-muted-foreground">
                            {row.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CellValue value={row.recruitos} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CellValue value={row.linkedin} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CellValue value={row.indeed} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Comparisons */}
          <div className="space-y-12 mb-16">
            {/* RecruitOS vs LinkedIn Recruiter */}
            <div>
              <h2 className="text-2xl font-light mb-4">
                RecruitOS vs LinkedIn Recruiter
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">LinkedIn Recruiter</strong> is a
                  general recruiting platform with 900M+ profiles across all industries.
                  It excels at broad candidate reach and networking-based hiring.
                  However, technical assessment relies on self-reported skills and
                  endorsements, which don't verify actual coding ability.
                </p>
                <p>
                  <strong className="text-foreground">RecruitOS</strong> focuses
                  exclusively on technical recruiting by analyzing GitHub contributions.
                  It evaluates code quality, project complexity, and technical depth—not
                  just claims. This makes it ideal for finding senior engineers and
                  specialized technical talent where code speaks louder than resumes.
                </p>
                <p>
                  <strong className="text-foreground">Best use case:</strong> Use
                  LinkedIn for junior roles and networking; use RecruitOS for senior
                  technical positions where GitHub activity provides strong signal.
                </p>
              </div>
            </div>

            {/* RecruitOS vs Indeed */}
            <div>
              <h2 className="text-2xl font-light mb-4">RecruitOS vs Indeed</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Indeed</strong> is a job board and
                  resume database focused on active job seekers. It works well for roles
                  where candidate volume matters more than technical depth. Assessment is
                  limited to resume screening and keyword matching.
                </p>
                <p>
                  <strong className="text-foreground">RecruitOS</strong> finds passive
                  candidates who may not be actively job hunting but demonstrate
                  expertise through open source contributions. These developers often
                  represent the top tier of talent—engineers passionate enough about
                  their craft to contribute publicly.
                </p>
                <p>
                  <strong className="text-foreground">Best use case:</strong> Use Indeed
                  for volume hiring and active job seekers; use RecruitOS to discover
                  elite engineers who aren't on traditional job boards.
                </p>
              </div>
            </div>

            {/* When to Use RecruitOS */}
            <div>
              <h2 className="text-2xl font-light mb-4">When to Use RecruitOS</h2>
              <div className="space-y-3 text-muted-foreground">
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong className="text-foreground">
                      Specialized technical roles:
                    </strong>{" "}
                    Systems engineers, infrastructure, embedded systems, ML engineers
                  </li>
                  <li>
                    <strong className="text-foreground">Senior positions:</strong> Where
                    GitHub activity indicates years of real experience
                  </li>
                  <li>
                    <strong className="text-foreground">Hard-to-fill roles:</strong>{" "}
                    Niche technologies where traditional sourcing fails
                  </li>
                  <li>
                    <strong className="text-foreground">Quality over quantity:</strong>{" "}
                    When you need evidence of technical depth, not just claims
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Open source hiring:
                    </strong>{" "}
                    Finding developers who contribute to relevant projects
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="p-8 rounded-lg border border-border bg-card text-center">
            <h3 className="text-2xl font-light mb-3">
              Ready to hire by what they've built?
            </h3>
            <p className="text-muted-foreground mb-6">
              Start your first search free—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Try RecruitOS free
              </Link>
              <Link
                href="/faq"
                className="px-6 py-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                Read FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
