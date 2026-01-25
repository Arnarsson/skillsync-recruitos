"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import Onboarding from "./Onboarding";

const ONBOARDING_KEY = "skillsync_onboarding_completed";

interface OnboardingWrapperProps {
  children: ReactNode;
}

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration gate pattern
    setMounted(true);

    // Check if user has completed onboarding - show immediately if not
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);

    if (!hasCompletedOnboarding) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration gate pattern
      setShowOnboarding(true);
    }
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, []);

  const handleSkip = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, []);

  // Ctrl/Cmd + Shift + O to reset onboarding (for testing)
  useEffect(() => {
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
  if (!mounted) {
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
