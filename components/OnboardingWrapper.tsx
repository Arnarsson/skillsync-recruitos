"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import Onboarding from "./Onboarding";

const ONBOARDING_KEY = "skillsync_onboarding_completed";

interface OnboardingWrapperProps {
  children: ReactNode;
}

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isHomePage) return;

    // Check if user has completed onboarding - show immediately if not
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);

    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [isHomePage]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, [isHomePage]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, []);

  // Ctrl/Cmd + Shift + O to reset onboarding (for testing)
  useEffect(() => {
    if (!isHomePage) return;

    const handleReset = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "O") {
        localStorage.removeItem(ONBOARDING_KEY);
        setShowOnboarding(true);
      }
    };

    window.addEventListener("keydown", handleReset);
    return () => window.removeEventListener("keydown", handleReset);
  }, []);

  // Don't render onboarding until mounted (SSR safety)
  if (!mounted || !isHomePage) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={handleComplete} onSkip={handleSkip} />
        )}
      </AnimatePresence>
    </>
  );
}
