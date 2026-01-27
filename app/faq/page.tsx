import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — RecruitOS Technical Recruiting Platform",
  description: "Common questions about RecruitOS: GitHub-based technical recruiting, pricing, features, and how to evaluate engineering candidates based on real code contributions.",
  keywords: [
    "technical recruiting FAQ",
    "GitHub recruiting questions",
    "engineering hiring",
    "technical recruiting software",
    "developer recruiting",
    "code-based hiring",
  ],
};

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is RecruitOS?",
    answer:
      "RecruitOS is a technical recruiting platform that helps companies find and evaluate engineering candidates based on their real GitHub contributions, code quality, and open source work. Unlike traditional recruiting tools that rely on resumes and self-reported skills, RecruitOS analyzes actual code to assess technical depth and expertise.",
  },
  {
    question: "How do I find senior engineers using RecruitOS?",
    answer:
      "RecruitOS searches GitHub for developers based on technical skills, not just keywords. You can search for specific expertise like 'kernel module developers' or 'signal processing researchers' and the platform analyzes actual code contributions to find engineers who have demonstrated that expertise through real work. The system identifies senior engineers by evaluating code quality, project complexity, and depth of contributions.",
  },
  {
    question: "What's the difference between RecruitOS and LinkedIn Recruiter?",
    answer:
      "LinkedIn Recruiter relies on self-reported skills and resume data, while RecruitOS analyzes real GitHub code contributions. LinkedIn shows what candidates claim they can do; RecruitOS shows what they've actually built. RecruitOS also focuses specifically on technical roles and provides deep code analysis, while LinkedIn is a general recruiting platform. Pricing: LinkedIn Recruiter starts at $170/month, RecruitOS starts at $499/month with deeper technical insights.",
  },
  {
    question: "How much does RecruitOS cost?",
    answer:
      "RecruitOS offers two plans: Pro at $499 per month per user (15 searches/month, 10 deep profile credits), and Enterprise with custom pricing. Deep profile credits are $5 each and unlock full technical analysis including project history and code quality assessment. We offer one free search to get started.",
  },
  {
    question: "How do you assess real engineering skills?",
    answer:
      "RecruitOS analyzes multiple signals from GitHub contributions: code quality and complexity, types of problems solved, domain expertise demonstrated in projects, contribution consistency and frequency, project impact and scope, and technical depth across different technologies. The platform doesn't just count commits—it evaluates the quality and significance of contributions.",
  },
  {
    question: "What are GitHub-based recruiting tools?",
    answer:
      "GitHub-based recruiting tools evaluate candidates by analyzing their open source contributions, code repositories, and development activity on GitHub. These tools provide objective data about technical skills by examining real code rather than relying on traditional resumes. RecruitOS is a GitHub-based recruiting platform that specializes in deep technical analysis of engineering candidates.",
  },
  {
    question: "Do candidates need to have public GitHub profiles?",
    answer:
      "Yes, RecruitOS analyzes public GitHub contributions. However, many excellent engineers contribute to open source even if they work on private codebases professionally. The platform helps you discover developers who demonstrate their skills publicly, which often indicates passion for their craft and willingness to share knowledge.",
  },
  {
    question: "How accurate is the technical assessment?",
    answer:
      "RecruitOS analyzes actual code and contributions, providing objective signal about technical abilities. While no automated system is perfect, evaluating real work is more accurate than resume screening or keyword matching. The deep profile analysis includes context about project types, technologies used, and contribution patterns to help recruiters make informed decisions.",
  },
  {
    question: "Can I integrate RecruitOS with my existing ATS?",
    answer:
      "Enterprise plans include MCP server access for custom workflows and internal app integrations. Contact our team to discuss integration options with your applicant tracking system or recruiting workflow tools.",
  },
  {
    question: "What types of engineering roles is RecruitOS best for?",
    answer:
      "RecruitOS excels at finding specialized technical talent: systems engineers, infrastructure developers, machine learning engineers, embedded systems programmers, open source maintainers, research engineers, and niche technology experts. It's particularly valuable for hard-to-fill senior engineering roles where GitHub activity provides strong signal about expertise.",
  },
  {
    question: "How is RecruitOS different from other technical recruiting platforms?",
    answer:
      "Most recruiting platforms use keyword matching or rely on candidate-entered data. RecruitOS analyzes the actual substance of code contributions—what problems were solved, how complex the implementations are, what domain knowledge is demonstrated. This means you discover engineers based on proven ability, not self-promotion or resume optimization.",
  },
  {
    question: "Do I need technical knowledge to use RecruitOS?",
    answer:
      "RecruitOS is designed for both technical and non-technical recruiters. The platform surfaces insights in plain language: what technologies a developer works with, what types of problems they solve, and how their expertise compares to role requirements. However, having technical team members review deep profiles can provide additional context.",
  },
];

// Generate JSON-LD structured data for FAQPage
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
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
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about RecruitOS and GitHub-based technical
              recruiting.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-border pb-8 last:border-b-0"
              >
                <h2 className="text-xl font-medium mb-3">{faq.question}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 rounded-lg border border-border bg-card text-center">
            <h3 className="text-2xl font-light mb-3">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              Reach out to our team and we'll help you get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/#pricing"
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                View pricing
              </Link>
              <a
                href="mailto:hello@recruitos.dev"
                className="px-6 py-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                Contact us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
