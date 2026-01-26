"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import Onboarding from "./Onboarding";

const ONBOARDING_KEY = "recruitos_intro_dismissed";

interface OnboardingWrapperProps {
  children: ReactNode;
}

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration gate pattern
    setMounted(true);

    // Check if user has dismissed onboarding - show if not dismissed
    const hasDismissed = localStorage.getItem(ONBOARDING_KEY);

    if (!hasDismissed) {
      setShowOnboarding(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, []);

  // Escape key dismisses onboarding
  useEffect(() => {
    if (!showOnboarding) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showOnboarding, handleDismiss]);

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
          <Onboarding onComplete={handleDismiss} onSkip={handleDismiss} />
        )}
      </AnimatePresence>
    </>
  );
}
