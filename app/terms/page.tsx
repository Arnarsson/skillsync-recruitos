"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0">
      <div className="max-w-3xl mx-auto px-4 pt-24 sm:pt-32 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-light mb-8 lowercase">
          terms of service
        </h1>

        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: January 2026
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using RecruitOS, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">2. Service Description</h2>
            <p className="text-muted-foreground mb-4">
              RecruitOS is an AI-powered recruitment decision-support system that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Searches for software engineers using public data sources</li>
              <li>Provides AI-generated analysis and scoring</li>
              <li>Generates personalized outreach recommendations</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>Important:</strong> RecruitOS is optimized for engineering and tech roles.
              It is not a general ATS or job board.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">3. Credit System</h2>
            <p className="text-muted-foreground mb-4">
              Our service operates on a credit-based system:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Credits are purchased once and used during hiring sprints</li>
              <li>Different operations consume different credit amounts</li>
              <li>No monthly subscription required</li>
              <li>Credits do not expire</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">4. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to access private or non-public data</li>
              <li>Resell or redistribute candidate data</li>
              <li>Use automated systems to scrape or extract data</li>
              <li>Discriminate against candidates based on protected characteristics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">5. AI-Generated Content</h2>
            <p className="text-muted-foreground">
              Our AI analysis is provided as decision-support, not as definitive assessments.
              Candidate scoring and recommendations should be used as one input among many
              in your hiring process. We encourage human review of all AI-generated insights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">6. Data Limitations</h2>
            <p className="text-muted-foreground">
              Our analysis is based on publicly available data. Private repositories,
              enterprise work, and non-public contributions are not visible. A low activity
              score does not necessarily indicate a poor candidate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              RecruitOS is provided &quot;as is&quot; without warranties of any kind. We are not
              liable for hiring decisions made based on our recommendations or any
              consequential damages arising from use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, contact us at:{" "}
              <a
                href="mailto:letsgo@recruitos.xyz"
                className="text-primary hover:underline"
              >
                letsgo@recruitos.xyz
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
