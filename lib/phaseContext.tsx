"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Phase = 1 | 2 | 3 | 4;

interface PhaseContextType {
  currentPhase: Phase;
  setPhase: (phase: Phase) => void;
  canAccessPhase: (phase: Phase) => boolean;
}

const PhaseContext = createContext<PhaseContextType | undefined>(undefined);

export function PhaseProvider({ children }: { children: ReactNode }) {
  const [currentPhase, setCurrentPhase] = useState<Phase>(1);
  const [completedPhases, setCompletedPhases] = useState<Set<Phase>>(new Set());

  // Load completed phases from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("recruitos_completed_phases");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCompletedPhases(new Set(parsed));
      } catch {
        // Ignore
      }
    }
  }, []);

  const setPhase = (phase: Phase) => {
    setCurrentPhase(phase);
    // Mark this phase and all previous phases as completed
    const newCompleted = new Set<Phase>();
    for (let i = 1; i <= phase; i++) {
      newCompleted.add(i as Phase);
    }
    setCompletedPhases(newCompleted);
    localStorage.setItem("recruitos_completed_phases", JSON.stringify(Array.from(newCompleted)));
  };

  const canAccessPhase = (phase: Phase) => {
    // Can access current phase or any completed phase
    return phase <= currentPhase || completedPhases.has(phase);
  };

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
