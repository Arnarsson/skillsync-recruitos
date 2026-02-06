"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";

type Phase = 1 | 2 | 3 | 4;

interface PhaseContextType {
  currentPhase: Phase;
  setPhase: (phase: Phase) => void;
  canAccessPhase: (phase: Phase) => boolean;
}

const PhaseContext = createContext<PhaseContextType | undefined>(undefined);

// Map routes to their corresponding phases
const ROUTE_PHASE_MAP: Record<string, Phase> = {
  "/search": 1,
  "/pipeline": 2,
  "/profile": 3,
  "/shortlist": 4,
};

/**
 * Get the phase for a given pathname
 */
function getPhaseFromPathname(pathname: string): Phase | null {
  // Check exact matches first
  if (ROUTE_PHASE_MAP[pathname]) {
    return ROUTE_PHASE_MAP[pathname];
  }
  // Check prefix matches (e.g., /profile/username)
  for (const [route, phase] of Object.entries(ROUTE_PHASE_MAP)) {
    if (pathname.startsWith(route)) {
      return phase;
    }
  }
  return null;
}

const STORAGE_KEY_PHASE = "recruitos_current_phase";
const STORAGE_KEY_COMPLETED = "recruitos_completed_phases";

export function PhaseProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Lazy initialization: read from localStorage during initial render (SSR-safe)
  const [currentPhase, setCurrentPhase] = useState<Phase>(() => {
    if (typeof window === "undefined") return 1;
    const stored = localStorage.getItem(STORAGE_KEY_PHASE);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 1 && parsed <= 4) {
        return parsed as Phase;
      }
    }
    return 1;
  });

  const [completedPhases, setCompletedPhases] = useState<Set<Phase>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = localStorage.getItem(STORAGE_KEY_COMPLETED);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      } catch {
        // Ignore
      }
    }
    return new Set();
  });

  // Hydration gate: mark as mounted after first client render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync phase with current route on pathname change
  useEffect(() => {
    if (!mounted) return;

    const routePhase = getPhaseFromPathname(pathname);
    if (routePhase !== null && routePhase !== currentPhase) {
      // Update current phase based on route
      setCurrentPhase(routePhase);
      localStorage.setItem(STORAGE_KEY_PHASE, routePhase.toString());

      // Mark this phase and all previous phases as completed
      setCompletedPhases((prev) => {
        const newCompleted = new Set(prev);
        for (let i = 1; i <= routePhase; i++) {
          newCompleted.add(i as Phase);
        }
        localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(Array.from(newCompleted)));
        return newCompleted;
      });
    }
  }, [pathname, mounted, currentPhase]);

  const setPhase = useCallback((phase: Phase) => {
    setCurrentPhase(phase);
    localStorage.setItem(STORAGE_KEY_PHASE, phase.toString());

    // Mark this phase and all previous phases as completed
    const newCompleted = new Set<Phase>();
    for (let i = 1; i <= phase; i++) {
      newCompleted.add(i as Phase);
    }
    setCompletedPhases(newCompleted);
    localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(Array.from(newCompleted)));
  }, []);

  const canAccessPhase = useCallback((phase: Phase) => {
    // Can access current phase or any completed phase
    return phase <= currentPhase || completedPhases.has(phase);
  }, [currentPhase, completedPhases]);

  // Prevent hydration mismatch by using default values until mounted
  if (!mounted) {
    return (
      <PhaseContext.Provider value={{ currentPhase: 1, setPhase, canAccessPhase: () => true }}>
        {children}
      </PhaseContext.Provider>
    );
  }

  return (
    <PhaseContext.Provider value={{ currentPhase, setPhase, canAccessPhase }}>
      {children}
    </PhaseContext.Provider>
  );
}

export function usePhase() {
  const context = useContext(PhaseContext);
  if (context === undefined) {
    throw new Error("usePhase must be used within a PhaseProvider");
  }
  return context;
}
