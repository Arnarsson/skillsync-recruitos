"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { AdminProvider } from "@/lib/adminContext";
import OnboardingWrapper from "./OnboardingWrapper";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AdminProvider>
        <LanguageProvider>
          <OnboardingWrapper>{children}</OnboardingWrapper>
        </LanguageProvider>
      </AdminProvider>
    </SessionProvider>
  );
}
