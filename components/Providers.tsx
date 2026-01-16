"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import OnboardingWrapper from "./OnboardingWrapper";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <OnboardingWrapper>{children}</OnboardingWrapper>
      </LanguageProvider>
    </SessionProvider>
  );
}
