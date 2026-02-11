"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import Onboarding from "./Onboarding";

const ONBOARDING_KEY = "recruitos_intro_dismissed";

interface OnboardingWrapperProps {
  children: ReactNode;
}

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const canShowOnboarding = pathname === "/";
  const isHiddenRoute =
    pathname?.startsWith("/report/") ||
    pathname?.startsWith("/embed/profile/") ||
    pathname === "/login" ||
    pathname === "/signup";
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!canShowOnboarding || isHiddenRoute) return;

    // Check if user has dismissed onboarding - show if not dismissed
    const hasDismissed = localStorage.getItem(ONBOARDING_KEY);

    if (!hasDismissed) {
      setShowOnboarding(true);
    }
  }, [canShowOnboarding, isHiddenRoute]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, []);

  const handleStartDemo = useCallback(() => {
    localStorage.setItem("recruitos_demo_mode", "true");
    localStorage.setItem("recruitos_admin_mode", "true");
    handleDismiss();
    router.push("/intake?demo=true");
  }, [handleDismiss, router]);

  const handleCustomSetup = useCallback(() => {
    handleDismiss();
    if (pathname !== "/intake") {
      router.push("/intake");
    }
  }, [handleDismiss, pathname, router]);

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
    if (!canShowOnboarding || isHiddenRoute) return;

    const handleReset = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "O") {
        localStorage.removeItem(ONBOARDING_KEY);
        setShowOnboarding(true);
      }
    };

    window.addEventListener("keydown", handleReset);
    return () => window.removeEventListener("keydown", handleReset);
  }, [canShowOnboarding, isHiddenRoute]);

  // Don't render onboarding until mounted (SSR safety)
  if (!mounted || !canShowOnboarding || isHiddenRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding
            onStartDemo={handleStartDemo}
            onCustomSetup={handleCustomSetup}
            onSkip={handleDismiss}
          />
        )}
      </AnimatePresence>
    </>
  );
}
