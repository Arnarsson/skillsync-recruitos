"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function TermsPage() {
  const { lang } = useLanguage();
  const isDa = lang === "da";

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0">
      <div className="max-w-3xl mx-auto px-4 pt-24 sm:pt-32 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {isDa ? "Tilbage til forsiden" : "Back to home"}
        </Link>

        <h1 className="text-3xl sm:text-4xl font-light mb-8 lowercase">
          {isDa ? "servicevilkår" : "terms of service"}
        </h1>

        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            {isDa ? "Sidst opdateret: Januar 2026" : "Last updated: January 2026"}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "1. Accept af vilkår" : "1. Acceptance of Terms"}
            </h2>
            <p className="text-muted-foreground">
              {isDa
                ? "Ved at tilgå eller bruge RecruitOS accepterer du disse servicevilkår. Hvis du ikke accepterer vilkårene, må du ikke bruge tjenesten."
                : "By accessing or using RecruitOS, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service."}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "2. Servicebeskrivelse" : "2. Service Description"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isDa
                ? "RecruitOS er et AI-drevet beslutningsstøttesystem til rekruttering, som:"
                : "RecruitOS is an AI-powered recruitment decision-support system that:"}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                {isDa
                  ? "Finder softwareudviklere via offentlige datakilder"
                  : "Searches for software engineers using public data sources"}
              </li>
              <li>
                {isDa
                  ? "Leverer AI-genereret analyse og scoring"
                  : "Provides AI-generated analysis and scoring"}
              </li>
              <li>
                {isDa
                  ? "Genererer personlige outreach-anbefalinger"
                  : "Generates personalized outreach recommendations"}
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>{isDa ? "Vigtigt:" : "Important:"}</strong>{" "}
              {isDa
                ? "RecruitOS er optimeret til engineering- og tech-roller. Det er ikke et generelt ATS eller jobboard."
                : "RecruitOS is optimized for engineering and tech roles. It is not a general ATS or job board."}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "3. Credit-system" : "3. Credit System"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isDa
                ? "Vores service bruger et credit-baseret system:"
                : "Our service operates on a credit-based system:"}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                {isDa
                  ? "Credits købes én gang og bruges i ansættelsesforløb"
                  : "Credits are purchased once and used during hiring sprints"}
              </li>
              <li>
                {isDa
                  ? "Forskellige handlinger bruger forskellige mængder credits"
                  : "Different operations consume different credit amounts"}
              </li>
              <li>
                {isDa
                  ? "Ingen månedlig abonnementspligt"
                  : "No monthly subscription required"}
              </li>
              <li>{isDa ? "Credits udløber ikke" : "Credits do not expire"}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "4. Acceptabel brug" : "4. Acceptable Use"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isDa ? "Du accepterer at undlade at:" : "You agree not to:"}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                {isDa
                  ? "Bruge tjenesten til ulovlige formål"
                  : "Use the service for any unlawful purpose"}
              </li>
              <li>
                {isDa
                  ? "Forsøge at tilgå private eller ikke-offentlige data"
                  : "Attempt to access private or non-public data"}
              </li>
              <li>
                {isDa
                  ? "Sælge videre eller redistribuere kandidatdata"
                  : "Resell or redistribute candidate data"}
              </li>
              <li>
                {isDa
                  ? "Bruge automatiserede systemer til scraping eller dataudtræk"
                  : "Use automated systems to scrape or extract data"}
              </li>
              <li>
                {isDa
                  ? "Diskriminere kandidater på baggrund af beskyttede karakteristika"
                  : "Discriminate against candidates based on protected characteristics"}
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "5. AI-genereret indhold" : "5. AI-Generated Content"}
            </h2>
            <p className="text-muted-foreground">
              {isDa
                ? "Vores AI-analyse leveres som beslutningsstøtte, ikke som endelige vurderinger. Kandidatscore og anbefalinger bør bruges som ét input blandt flere i ansættelsesprocessen. Vi anbefaler menneskelig gennemgang af alle AI-indsigter."
                : "Our AI analysis is provided as decision-support, not as definitive assessments. Candidate scoring and recommendations should be used as one input among many in your hiring process. We encourage human review of all AI-generated insights."}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "6. Databegrænsninger" : "6. Data Limitations"}
            </h2>
            <p className="text-muted-foreground">
              {isDa
                ? "Vores analyse bygger på offentligt tilgængelige data. Private repositories, enterprise-arbejde og ikke-offentlige bidrag er ikke synlige. Lav aktivitetsscore betyder ikke nødvendigvis en svag kandidat."
                : "Our analysis is based on publicly available data. Private repositories, enterprise work, and non-public contributions are not visible. A low activity score does not necessarily indicate a poor candidate."}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "7. Ansvarsbegrænsning" : "7. Limitation of Liability"}
            </h2>
            <p className="text-muted-foreground">
              {isDa
                ? "RecruitOS leveres \"som den er\" uden garantier af nogen art. Vi er ikke ansvarlige for ansættelsesbeslutninger truffet på baggrund af vores anbefalinger eller for følgeskader ved brug af tjenesten."
                : "RecruitOS is provided \"as is\" without warranties of any kind. We are not liable for hiring decisions made based on our recommendations or any consequential damages arising from use of the service."}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">{isDa ? "8. Kontakt" : "8. Contact"}</h2>
            <p className="text-muted-foreground">
              {isDa
                ? "Ved spørgsmål til vilkårene, kontakt os på:"
                : "For questions about these terms, contact us at:"}{" "}
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
