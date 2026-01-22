"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Users, GitCompare, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Simplified candidate type for the shortlist panel
interface ShortlistCandidate {
  id: string;
  name: string;
  avatar: string;
}

interface ShortlistPanelProps {
  selectedCandidates: ShortlistCandidate[];
  totalCandidates: number;
  onCompare: () => void;
  onClearSelection: () => void;
  onMoveToDeepDive: () => void;
  onRemoveCandidate: (id: string) => void;
}

const MAX_VISIBLE_AVATARS = 5;

export function ShortlistPanel({
  selectedCandidates,
  totalCandidates,
  onCompare,
  onClearSelection,
  onMoveToDeepDive,
  onRemoveCandidate,
}: ShortlistPanelProps) {
  const selectedCount = selectedCandidates.length;
  const isVisible = selectedCount > 0;
  const canCompare = selectedCount >= 2 && selectedCount <= 4;
  const extraCount = selectedCount - MAX_VISIBLE_AVATARS;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Selection Count */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <Badge variant="secondary" className="font-medium">
                  {selectedCount} of {totalCandidates}
                </Badge>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  selected
                </span>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-border" />

              {/* Mini Avatars */}
              <div className="flex items-center -space-x-2">
                {selectedCandidates.slice(0, MAX_VISIBLE_AVATARS).map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => onRemoveCandidate(candidate.id)}
                    className="relative group"
                    title={`Remove ${candidate.name}`}
                  >
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="w-8 h-8 rounded-full border-2 border-background transition-transform group-hover:scale-110 group-hover:z-10"
                    />
                    <div className="absolute inset-0 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  </button>
                ))}
                {extraCount > 0 && (
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{extraCount}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-border hidden sm:block" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Compare Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCompare}
                  disabled={!canCompare}
                  className="hidden sm:flex gap-1.5"
                  title={
                    canCompare
                      ? "Compare selected candidates"
                      : "Select 2-4 candidates to compare"
                  }
                >
                  <GitCompare className="w-4 h-4" />
                  <span className="hidden md:inline">Compare</span>
                </Button>

                {/* Clear Selection */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>

                {/* Move to Deep Dive CTA */}
                <Button
                  size="sm"
                  onClick={onMoveToDeepDive}
                  className="gap-1.5"
                >
                  <span className="hidden sm:inline">Move to Deep Dive</span>
                  <span className="sm:hidden">Deep Dive</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
