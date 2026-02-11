"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function PrivacyPage() {
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
          {isDa ? "privatlivspolitik" : "privacy policy"}
        </h1>

        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            {isDa ? "Sidst opdateret: Januar 2026" : "Last updated: January 2026"}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "1. Oplysninger vi indsamler" : "1. Information We Collect"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isDa
                ? "RecruitOS indsamler oplysninger, som du giver direkte, herunder:"
                : "RecruitOS collects information you provide directly, including:"}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                {isDa
                  ? "Kontooplysninger (email, navn) ved oprettelse"
                  : "Account information (email, name) when you sign up"}
              </li>
              <li>
                {isDa
                  ? "Jobbeskrivelser og krav, du indsender"
                  : "Job descriptions and requirements you submit"}
              </li>
              <li>{isDa ? "Søgeforespørgsler og præferencer" : "Search queries and preferences"}</li>
              <li>{isDa ? "Brugsdata og analytics" : "Usage data and analytics"}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "2. Offentlige datakilder" : "2. Public Data Sources"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isDa
                ? "Vi analyserer offentligt tilgængelige oplysninger fra:"
                : "We analyze publicly available information from:"}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                {isDa
                  ? "Offentlige GitHub-profiler og repositories"
                  : "GitHub public profiles and repositories"}
              </li>
              <li>
                {isDa
                  ? "Offentlige LinkedIn-profiler (når tilgængelige)"
                  : "LinkedIn public profiles (when available)"}
              </li>
              <li>{isDa ? "Offentlige portfolio-sider" : "Public portfolio websites"}</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              {isDa
                ? "Vi tilgår ikke private repositories eller ikke-offentlige oplysninger."
                : "We do not access private repositories or non-public information."}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "3. Sådan bruger vi oplysninger" : "3. How We Use Information"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isDa ? "Vi bruger de indsamlede oplysninger til at:" : "We use collected information to:"}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                {isDa
                  ? "Levere kandidat-søgning og analyse"
                  : "Provide candidate search and analysis services"}
              </li>
              <li>
                {isDa
                  ? "Generere AI-drevne indsigter og anbefalinger"
                  : "Generate AI-powered insights and recommendations"}
              </li>
              <li>
                {isDa
                  ? "Forbedre vores algoritmer og brugeroplevelse"
                  : "Improve our algorithms and user experience"}
              </li>
              <li>
                {isDa
                  ? "Kommunikere med dig om din konto"
                  : "Communicate with you about your account"}
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "4. Opbevaring af data" : "4. Data Retention"}
            </h2>
            <p className="text-muted-foreground">
              {isDa
                ? "Vi opbevarer dine data, så længe din konto er aktiv, eller så længe det er nødvendigt for at levere vores service. Du kan til enhver tid anmode om sletning ved at kontakte os."
                : "We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your data at any time by contacting us."}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">
              {isDa ? "5. Overholdelse af EU AI Act" : "5. EU AI Act Compliance"}
            </h2>
            <p className="text-muted-foreground">
              {isDa
                ? "RecruitOS opretholder uforanderlige audit-logs for alle AI-assisterede kandidatvurderinger i overensstemmelse med EU AI Act. Disse logs kan udleveres ved forespørgsel af hensyn til transparens og ansvarlighed."
                : "RecruitOS maintains immutable audit logs for all AI-assisted candidate evaluation decisions in compliance with EU AI Act requirements. These logs are available upon request for transparency and accountability purposes."}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">{isDa ? "6. Kontakt" : "6. Contact"}</h2>
            <p className="text-muted-foreground">
              {isDa
                ? "Ved spørgsmål om privatliv eller dataanmodninger, kontakt os på:"
                : "For privacy-related questions or requests, contact us at:"}{" "}
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
