"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { AdminProvider } from "@/lib/adminContext";
import { PhaseProvider } from "@/lib/phaseContext";
import OnboardingWrapper from "./OnboardingWrapper";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AdminProvider>
        <LanguageProvider>
          <PhaseProvider>
            <OnboardingWrapper>{children}</OnboardingWrapper>
          </PhaseProvider>
        </LanguageProvider>
      </AdminProvider>
    </SessionProvider>
  );
}
