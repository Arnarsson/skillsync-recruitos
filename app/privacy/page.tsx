"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          privacy policy
        </h1>

        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: January 2026
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              RecruitOS collects information you provide directly, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Account information (email, name) when you sign up</li>
              <li>Job descriptions and requirements you submit</li>
              <li>Search queries and preferences</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">2. Public Data Sources</h2>
            <p className="text-muted-foreground mb-4">
              We analyze publicly available information from:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>GitHub public profiles and repositories</li>
              <li>LinkedIn public profiles (when available)</li>
              <li>Public portfolio websites</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not access private repositories or non-public information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">3. How We Use Information</h2>
            <p className="text-muted-foreground mb-4">
              We use collected information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide candidate search and analysis services</li>
              <li>Generate AI-powered insights and recommendations</li>
              <li>Improve our algorithms and user experience</li>
              <li>Communicate with you about your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">4. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active or as needed to provide services.
              You can request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">5. EU AI Act Compliance</h2>
            <p className="text-muted-foreground">
              RecruitOS maintains immutable audit logs for all AI-powered profiling decisions
              in compliance with EU AI Act requirements. These logs are available upon request
              for transparency and accountability purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">6. Contact</h2>
            <p className="text-muted-foreground">
              For privacy-related questions or requests, contact us at:{" "}
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
