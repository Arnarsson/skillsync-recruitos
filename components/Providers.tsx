"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import OnboardingWrapper from "./OnboardingWrapper";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <OnboardingWrapper>{children}</OnboardingWrapper>
    </SessionProvider>
  );
}
