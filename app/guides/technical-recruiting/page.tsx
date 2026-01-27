import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Complete Guide to Technical Recruiting — Hiring Engineers in 2025",
  description:
    "Learn how to find, evaluate, and hire software engineers. Best practices for GitHub-based assessment, code review, and technical recruiting strategies.",
  keywords: [
    "technical recruiting guide",
    "hiring software engineers",
    "GitHub recruiting",
    "engineering hiring",
    "developer assessment",
    "code-based hiring",
    "technical interview",
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Complete Guide to Technical Recruiting in 2025",
  description:
    "Comprehensive guide to finding and hiring software engineers through GitHub analysis and code-based assessment",
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

export default function TechnicalRecruitingGuide() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="min-h-screen bg-background py-20 px-4">
        <div className="max-w-4xl mx-auto">
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
              Complete Guide to Technical Recruiting
            </h1>
            <p className="text-lg text-muted-foreground">
              How to find and hire exceptional software engineers in 2025
            </p>
          </div>

          {/* Article Content */}
          <article className="prose prose-invert prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-12">
              <h2 className="text-3xl font-light mb-4">
                The Challenge of Technical Hiring
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Hiring software engineers is fundamentally different from other
                recruiting. Technical skills are objective—either someone can write
                efficient database queries or they can't. Either they understand
                distributed systems or they don't. Yet traditional recruiting methods
                rely on subjective signals: polished resumes, interview performance,
                self-reported skills.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The best engineers often aren't the best interviewers. They're building
                things. This guide explains how to evaluate technical talent based on
                what they've actually built, not what they claim.
              </p>
            </section>

            {/* Finding Candidates */}
            <section className="mb-12">
              <h2 className="text-3xl font-light mb-4">
                Finding Technical Candidates
              </h2>

              <h3 className="text-2xl font-light mb-3 mt-8">
                1. GitHub and Open Source
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                GitHub is the world's largest repository of technical work. Engineers who
                contribute to open source demonstrate:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Real coding ability (not theoretical knowledge)</li>
                <li>Passion for their craft (contributing outside work hours)</li>
                <li>Collaboration skills (working with maintainers and community)</li>
                <li>Domain expertise (specific technologies and problem domains)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">
                  Tools like RecruitOS search GitHub by technical skills
                </strong>
                , analyzing actual code to find developers with demonstrated expertise.
                This surfaces candidates who may not be on LinkedIn or active job boards.
              </p>

              <h3 className="text-2xl font-light mb-3 mt-8">
                2. Technical Communities
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>
                  <strong className="text-foreground">Stack Overflow:</strong> Developers
                  who answer technical questions
                </li>
                <li>
                  <strong className="text-foreground">Hacker News:</strong> Tech-focused
                  discussion forum
                </li>
                <li>
                  <strong className="text-foreground">Dev.to/Hashnode:</strong>{" "}
                  Engineering blogs and tutorials
                </li>
                <li>
                  <strong className="text-foreground">Reddit:</strong> Programming
                  subreddits (r/programming, language-specific)
                </li>
                <li>
                  <strong className="text-foreground">Discord/Slack:</strong>{" "}
                  Open source project communities
                </li>
              </ul>

              <h3 className="text-2xl font-light mb-3 mt-8">3. Passive Candidates</h3>
              <p className="text-muted-foreground leading-relaxed">
                The best engineers are rarely unemployed. Focus on:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Engineers at innovative companies (not necessarily big tech)</li>
                <li>
                  Active open source contributors (shows passion beyond day job)
                </li>
                <li>Technical bloggers and conference speakers</li>
                <li>Maintainers of popular libraries or tools</li>
              </ul>
            </section>

            {/* Evaluating Candidates */}
            <section className="mb-12">
              <h2 className="text-3xl font-light mb-4">
                Evaluating Technical Ability
              </h2>

              <h3 className="text-2xl font-light mb-3 mt-8">
                Reading GitHub Profiles
              </h3>
              <div className="space-y-4 text-muted-foreground mb-6">
                <div>
                  <h4 className="text-xl font-medium text-foreground mb-2">
                    Green Flags ✅
                  </h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      <strong className="text-foreground">
                        Meaningful contributions:
                      </strong>{" "}
                      PRs that solve real problems, not just typo fixes
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Consistent activity:
                      </strong>{" "}
                      Regular commits over months/years
                    </li>
                    <li>
                      <strong className="text-foreground">Complex projects:</strong>{" "}
                      Non-trivial systems, not just tutorials
                    </li>
                    <li>
                      <strong className="text-foreground">Code quality:</strong> Clean,
                      well-documented, tested code
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Community engagement:
                      </strong>{" "}
                      Helping others in issues/discussions
                    </li>
                    <li>
                      <strong className="text-foreground">Domain depth:</strong> Deep
                      expertise in specific areas
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xl font-medium text-foreground mb-2">
                    Red Flags 🚩
                  </h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      <strong className="text-foreground">Empty repos:</strong> Projects
                      with no real code
                    </li>
                    <li>
                      <strong className="text-foreground">Only forks:</strong> No
                      original work or meaningful contributions
                    </li>
                    <li>
                      <strong className="text-foreground">Tutorial copying:</strong>{" "}
                      Projects that are obviously from tutorials
                    </li>
                    <li>
                      <strong className="text-foreground">No documentation:</strong>{" "}
                      Uncommented, unclear code
                    </li>
                    <li>
                      <strong className="text-foreground">Padding activity:</strong>{" "}
                      Many trivial commits to boost contribution count
                    </li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-light mb-3 mt-8">
                Code Quality Assessment
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When reviewing code contributions, look for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Readability:</strong> Can you
                  understand what the code does?
                </li>
                <li>
                  <strong className="text-foreground">Problem-solving:</strong> Are
                  solutions elegant or hacky?
                </li>
                <li>
                  <strong className="text-foreground">Testing:</strong> Are there tests?
                  Do they cover edge cases?
                </li>
                <li>
                  <strong className="text-foreground">Performance:</strong> Are
                  algorithms efficient?
                </li>
                <li>
                  <strong className="text-foreground">Error handling:</strong> How are
                  failures managed?
                </li>
                <li>
                  <strong className="text-foreground">Documentation:</strong> Are
                  complex parts explained?
                </li>
              </ul>
            </section>

            {/* Interview Process */}
            <section className="mb-12">
              <h2 className="text-3xl font-light mb-4">
                The Technical Interview Process
              </h2>

              <h3 className="text-2xl font-light mb-3 mt-8">
                1. Portfolio Review (30 min)
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Start with what they've built. Ask them to walk through:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Their most interesting project</li>
                <li>Technical decisions and tradeoffs</li>
                <li>Challenges they solved</li>
                <li>What they'd do differently now</li>
              </ul>

              <h3 className="text-2xl font-light mb-3 mt-8">
                2. Technical Discussion (45-60 min)
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Discuss real problems your team faces. Don't use whiteboard puzzles—use
                actual challenges from your codebase. This reveals:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>How they approach unfamiliar problems</li>
                <li>Their thought process and communication</li>
                <li>Whether their expertise matches your needs</li>
              </ul>

              <h3 className="text-2xl font-light mb-3 mt-8">3. Code Review (30 min)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Share a real PR from your codebase (anonymized). Ask them to review it.
                This shows how they think about code quality, edge cases, and
                collaboration.
              </p>
            </section>

            {/* Modern Tools */}
            <section className="mb-12">
              <h2 className="text-3xl font-light mb-4">
                Modern Technical Recruiting Tools
              </h2>

              <h3 className="text-2xl font-light mb-3 mt-8">
                GitHub-Based Platforms
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">RecruitOS</strong> analyzes GitHub
                contributions to find engineers based on demonstrated technical skills.
                Unlike resume databases, it evaluates actual code quality, project
                complexity, and domain expertise. This is particularly valuable for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Senior technical roles where experience matters</li>
                <li>Specialized positions (systems, ML, embedded, etc.)</li>
                <li>Finding passive candidates who aren't job searching</li>
                <li>Evaluating candidates beyond traditional signals</li>
              </ul>

              <h3 className="text-2xl font-light mb-3 mt-8">When to Use What</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">LinkedIn:</strong> Junior roles,
                  networking, active job seekers
                </li>
                <li>
                  <strong className="text-foreground">Indeed/Job boards:</strong> Volume
                  hiring, entry-level positions
                </li>
                <li>
                  <strong className="text-foreground">RecruitOS:</strong> Senior
                  technical roles, specialized expertise, GitHub-active developers
                </li>
                <li>
                  <strong className="text-foreground">Referrals:</strong> Cultural fit,
                  team expansion
                </li>
              </ul>
            </section>

            {/* Common Mistakes */}
            <section className="mb-12">
              <h2 className="text-3xl font-light mb-4">
                Common Technical Recruiting Mistakes
              </h2>
              <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">
                    Keyword matching resumes:
                  </strong>{" "}
                  Candidates game this by stuffing keywords. Look at real work instead.
                </li>
                <li>
                  <strong className="text-foreground">
                    Whiteboard algorithm puzzles:
                  </strong>{" "}
                  Poor predictor of job performance. Use real-world problems.
                </li>
                <li>
                  <strong className="text-foreground">
                    Requiring perfect matches:
                  </strong>{" "}
                  Good engineers learn quickly. Value problem-solving over specific
                  frameworks.
                </li>
                <li>
                  <strong className="text-foreground">Ignoring open source:</strong>{" "}
                  Engineers with quality GitHub profiles have proven skills.
                </li>
                <li>
                  <strong className="text-foreground">Over-emphasizing degrees:</strong>{" "}
                  Many excellent engineers are self-taught or bootcamp-trained.
                </li>
                <li>
                  <strong className="text-foreground">Long hiring processes:</strong>{" "}
                  Top candidates get multiple offers. Move quickly.
                </li>
              </ul>
            </section>

            {/* Conclusion */}
            <section className="mb-12">
              <h2 className="text-3xl font-light mb-4">Key Takeaways</h2>
              <div className="p-6 rounded-lg border border-primary/20 bg-primary/5">
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    ✓{" "}
                    <strong className="text-foreground">
                      Evaluate real work, not claims
                    </strong>{" "}
                    — GitHub contributions are objective signal
                  </li>
                  <li>
                    ✓{" "}
                    <strong className="text-foreground">
                      Find passive candidates
                    </strong>{" "}
                    — The best engineers aren't on job boards
                  </li>
                  <li>
                    ✓{" "}
                    <strong className="text-foreground">
                      Use modern tools
                    </strong>{" "}
                    — Platforms like RecruitOS analyze code quality at scale
                  </li>
                  <li>
                    ✓{" "}
                    <strong className="text-foreground">
                      Interview based on reality
                    </strong>{" "}
                    — Discuss actual problems, not theoretical puzzles
                  </li>
                  <li>
                    ✓{" "}
                    <strong className="text-foreground">Move quickly</strong> — Good
                    candidates won't wait weeks for decisions
                  </li>
                </ul>
              </div>
            </section>
          </article>

          {/* CTA */}
          <div className="mt-16 p-8 rounded-lg border border-border bg-card text-center">
            <h3 className="text-2xl font-light mb-3">
              Ready to find engineers by what they've built?
            </h3>
            <p className="text-muted-foreground mb-6">
              RecruitOS analyzes GitHub contributions to surface technical talent based
              on real code, not resumes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Start free search
              </Link>
              <Link
                href="/compare"
                className="px-6 py-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                Compare platforms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
