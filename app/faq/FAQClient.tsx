"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS_EN: FAQItem[] = [
  {
    question: "What is RecruitOS?",
    answer:
      "RecruitOS is a technical recruiting platform that helps companies find and evaluate engineering candidates based on real GitHub contributions, code quality, and open source work.",
  },
  {
    question: "How do I find senior engineers using RecruitOS?",
    answer:
      "You search for concrete technical skills, and RecruitOS evaluates code complexity, project scope, and contribution depth to identify stronger candidates.",
  },
  {
    question: "What's the difference between RecruitOS and LinkedIn Recruiter?",
    answer:
      "LinkedIn relies on self-reported profile data. RecruitOS uses public code evidence and engineering signals from GitHub to support technical hiring decisions.",
  },
  {
    question: "How much does RecruitOS cost?",
    answer:
      "RecruitOS has plan-based and credit-based options. Deep profile credits unlock fuller technical analysis and candidate evidence.",
  },
  {
    question: "How do you assess real engineering skills?",
    answer:
      "We analyze signals like code quality, complexity, contribution consistency, collaboration, and domain-specific project evidence.",
  },
  {
    question: "Do candidates need public GitHub profiles?",
    answer:
      "Yes. RecruitOS relies on publicly available data and cannot evaluate private repositories or private enterprise code.",
  },
  {
    question: "How accurate is the technical assessment?",
    answer:
      "The assessment is evidence-based and should be used as decision support alongside interviews, references, and human review.",
  },
  {
    question: "Can I integrate RecruitOS with my ATS?",
    answer:
      "Enterprise setups support integrations and custom workflows. Contact the team to scope your ATS integration requirements.",
  },
];

const FAQS_DA: FAQItem[] = [
  {
    question: "Hvad er RecruitOS?",
    answer:
      "RecruitOS er en teknisk rekrutteringsplatform, der hjælper virksomheder med at finde og vurdere ingeniørkandidater ud fra reelle GitHub-bidrag, kodekvalitet og open source-arbejde.",
  },
  {
    question: "Hvordan finder jeg seniorudviklere med RecruitOS?",
    answer:
      "Du søger på konkrete tekniske kompetencer, og RecruitOS vurderer kodekompleksitet, projektscope og bidragsdybde for at identificere stærkere kandidater.",
  },
  {
    question: "Hvad er forskellen på RecruitOS og LinkedIn Recruiter?",
    answer:
      "LinkedIn bygger primært på selvrapporterede profiler. RecruitOS bruger offentlige kodebeviser og engineering-signaler fra GitHub som beslutningsstøtte i teknisk rekruttering.",
  },
  {
    question: "Hvad koster RecruitOS?",
    answer:
      "RecruitOS har både abonnements- og credit-baserede muligheder. Credits låser dybere teknisk analyse og kandidatbeviser op.",
  },
  {
    question: "Hvordan vurderer I reelle engineering-kompetencer?",
    answer:
      "Vi analyserer signaler som kodekvalitet, kompleksitet, bidragskonsistens, samarbejde og domænespecifikke projektbeviser.",
  },
  {
    question: "Skal kandidater have en offentlig GitHub-profil?",
    answer:
      "Ja. RecruitOS bygger på offentligt tilgængelige data og kan ikke analysere private repositories eller privat enterprise-kode.",
  },
  {
    question: "Hvor præcis er den tekniske vurdering?",
    answer:
      "Vurderingen er evidensbaseret og bør bruges som beslutningsstøtte sammen med interviews, referencer og menneskelig vurdering.",
  },
  {
    question: "Kan RecruitOS integreres med vores ATS?",
    answer:
      "Enterprise-opsætninger understøtter integrationer og custom workflows. Kontakt teamet for at afklare krav til ATS-integration.",
  },
];

export default function FAQClient() {
  const { lang } = useLanguage();
  const isDa = lang === "da";
  const faqs = isDa ? FAQS_DA : FAQS_EN;

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isDa ? "Tilbage til forsiden" : "Back to home"}
        </Link>

        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-light mb-4">
            {isDa ? "Ofte stillede spørgsmål" : "Frequently Asked Questions"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isDa
              ? "Alt du skal vide om RecruitOS og GitHub-baseret teknisk rekruttering."
              : "Everything you need to know about RecruitOS and GitHub-based technical recruiting."}
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-border pb-8 last:border-b-0">
              <h2 className="text-xl font-medium mb-3">{faq.question}</h2>
              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-lg border border-border bg-card text-center">
          <h3 className="text-2xl font-light mb-3">
            {isDa ? "Har du stadig spørgsmål?" : "Still have questions?"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {isDa
              ? "Kontakt teamet, så hjælper vi dig i gang."
              : "Reach out to our team and we'll help you get started."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/#pricing"
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isDa ? "Se priser" : "View pricing"}
            </Link>
            <a
              href="mailto:hello@recruitos.dev"
              className="px-6 py-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              {isDa ? "Kontakt os" : "Contact us"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
