"use client";

import { useState } from "react";
import { 
  DndContext, 
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search, UserPlus, MessageSquare, CheckCircle, Trophy, MoreHorizontal, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStage = "sourced" | "contacted" | "replied" | "interview" | "offer";

export interface PipelineCandidate {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
  score?: number;
  stage: PipelineStage;
  addedAt: string;
  lastActivity?: string;
}

interface PipelineKanbanProps {
  candidates: PipelineCandidate[];
  onStageChange: (candidateId: string, newStage: PipelineStage) => void;
  onCandidateClick?: (candidate: PipelineCandidate) => void;
}

const STAGES: { id: PipelineStage; label: string; icon: React.ElementType; color: string }[] = [
  { id: "sourced", label: "Sourced", icon: Search, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { id: "contacted", label: "Contacted", icon: MessageSquare, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  { id: "replied", label: "Replied", icon: UserPlus, color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  { id: "interview", label: "Interview", icon: CheckCircle, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  { id: "offer", label: "Offer", icon: Trophy, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
];

function SortableCard({ candidate, onClick }: { candidate: PipelineCandidate; onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 cursor-grab active:cursor-grabbing",
        "hover:border-zinc-600 transition-all group",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        {candidate.avatar ? (
          <img
            src={candidate.avatar}
            alt={candidate.name}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-sm">
            {candidate.name?.charAt(0) || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm truncate">{candidate.name}</span>
            {candidate.score && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                candidate.score >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                candidate.score >= 60 ? "bg-amber-500/20 text-amber-400" :
                "bg-zinc-500/20 text-zinc-400"
              )}>
                {candidate.score}%
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 truncate">@{candidate.username}</p>
          {candidate.role && (
            <p className="text-xs text-zinc-400 truncate mt-1">{candidate.role}</p>
          )}
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all">
          <ExternalLink className="w-3 h-3 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: PipelineCandidate }) {
  return (
    <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 shadow-lg">
      <div className="flex items-start gap-3">
        {candidate.avatar ? (
          <img src={candidate.avatar} alt={candidate.name} className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-sm">
            {candidate.name?.charAt(0) || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-white text-sm">{candidate.name}</span>
          <p className="text-xs text-zinc-500">@{candidate.username}</p>
        </div>
      </div>
    </div>
  );
}

export function PipelineKanban({ candidates, onStageChange, onCandidateClick }: PipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeCandidate = activeId 
    ? candidates.find(c => c.id === activeId) 
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const candidateId = active.id as string;
      // Check if dropped over a stage column
      const stage = STAGES.find(s => s.id === over.id)?.id;
      if (stage) {
        onStageChange(candidateId, stage);
      }
    }
  };

  const getCandidatesByStage = (stage: PipelineStage) => 
    candidates.filter(c => c.stage === stage);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageCandidates = getCandidatesByStage(stage.id);
          const StageIcon = stage.icon;

          return (
            <div
              key={stage.id}
              id={stage.id}
              className="flex-shrink-0 w-72"
            >
              {/* Column Header */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-t-lg border",
                stage.color
              )}>
                <StageIcon className="w-4 h-4" />
                <span className="font-medium text-sm">{stage.label}</span>
                <span className="ml-auto text-xs bg-black/20 px-2 py-0.5 rounded-full">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="bg-zinc-900/50 border border-t-0 border-zinc-800 rounded-b-lg p-2 min-h-[400px]">
                <SortableContext
                  items={stageCandidates.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {stageCandidates.map(candidate => (
                      <SortableCard
                        key={candidate.id}
                        candidate={candidate}
                        onClick={() => onCandidateClick?.(candidate)}
                      />
                    ))}
                  </div>
                </SortableContext>

                {stageCandidates.length === 0 && (
                  <div className="h-20 flex items-center justify-center text-zinc-600 text-sm">
                    Drop candidates here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeCandidate ? <CandidateCard candidate={activeCandidate} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
