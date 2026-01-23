"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CandidateDetailPanel } from "./CandidateDetailPanel";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

interface ScoreBreakdown {
  requiredMatched: string[];
  requiredMissing: string[];
  preferredMatched: string[];
  locationMatch: "exact" | "remote" | "none";
  baseScore: number;
  skillsScore: number;
  preferredScore: number;
  locationScore: number;
}

interface Candidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  avatar: string;
  skills: string[];
  createdAt?: string;
  risks?: string[];
  keyEvidence?: string[];
  scoreBreakdown?: ScoreBreakdown;
  persona?: {
    archetype?: string;
    riskAssessment?: {
      attritionRisk?: string;
    };
  };
}

interface PipelineSplitViewProps {
  candidates: Candidate[];
  viewMode: "list" | "split";
  onViewModeChange: (mode: "list" | "split") => void;
  selectedCandidateId: string | null;
  onSelectCandidate: (id: string | null) => void;
  onOutreach: (candidate: Candidate) => void;
  renderListItem: (candidate: Candidate, isCompact: boolean) => ReactNode;
}

export function PipelineSplitView({
  candidates,
  viewMode,
  onViewModeChange,
  selectedCandidateId,
  onSelectCandidate,
  onOutreach,
  renderListItem,
}: PipelineSplitViewProps) {
  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  const handleClosePanel = useCallback(() => {
    onSelectCandidate(null);
  }, [onSelectCandidate]);

  return (
    <div className="relative">
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
          <Button
            variant={viewMode === "split" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("split")}
            className="gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Split</span>
          </Button>
        </div>
      </div>

      {/* Split View Layout */}
      <div className={`flex gap-4 ${viewMode === "split" && selectedCandidate ? "" : ""}`}>
        {/* List Panel */}
        <motion.div
          layout
          className={
            viewMode === "split" && selectedCandidate
              ? "w-[35%] min-w-[300px] space-y-3"
              : "w-full space-y-3"
          }
        >
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => {
                if (viewMode === "split") {
                  onSelectCandidate(
                    selectedCandidateId === candidate.id ? null : candidate.id
                  );
                }
              }}
              className={viewMode === "split" ? "cursor-pointer" : ""}
            >
              <div
                className={
                  viewMode === "split" && selectedCandidateId === candidate.id
                    ? "ring-2 ring-primary rounded-xl"
                    : ""
                }
              >
                {renderListItem(candidate, viewMode === "split" && !!selectedCandidate)}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Detail Panel */}
        <AnimatePresence>
          {viewMode === "split" && selectedCandidate && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "65%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="sticky top-24 h-[calc(100vh-8rem)] rounded-xl overflow-hidden border"
            >
              <CandidateDetailPanel
                candidate={selectedCandidate}
                onClose={handleClosePanel}
                onOutreach={onOutreach}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Hook for managing split view state
export function useSplitView() {
  const [viewMode, setViewMode] = useState<"list" | "split">("list");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Disable split view on mobile - must be in useEffect for SSR safety
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setViewMode("list");
        setSelectedCandidateId(null);
      }
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return {
    viewMode: isMobile ? "list" : viewMode,
    setViewMode,
    selectedCandidateId,
    setSelectedCandidateId,
    isSplitViewEnabled: !isMobile,
  };
}
