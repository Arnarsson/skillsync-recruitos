"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import Onboarding from "./Onboarding";

const ONBOARDING_KEY = "recruitos_intro_dismissed";

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

    // Check if user has dismissed onboarding - show if not dismissed
    const hasDismissed = localStorage.getItem(ONBOARDING_KEY);

    if (!hasDismissed) {
      setShowOnboarding(true);
    }
  }, [isHomePage]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, [isHomePage]);

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
          <Onboarding onComplete={handleDismiss} onSkip={handleDismiss} />
        )}
      </AnimatePresence>
    </>
  );
}
