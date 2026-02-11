"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { candidateService } from "@/services/candidateService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkedInNav, LinkedInEmptyState } from "@/components/linkedin/LinkedInNav";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import {
  Linkedin,
  RefreshCw,
  Loader2,
  ExternalLink,
  MapPin,
  Briefcase,
  GripVertical,
  Plus,
  Zap,
  Trash2,
  ArrowRight,
  Kanban,
} from "lucide-react";

interface Candidate {
  id: string;
  linkedinId: string;
  linkedinUrl: string;
  name: string;
  headline: string;
  location: string;
  currentCompany: string;
  photoUrl: string;
  openToWork: boolean;
  stage: string;
}

export default function LinkedInPipelinePage() {
  const { lang } = useLanguage();
  const isDa = lang === "da";
  const STAGES = [
    { id: "captured", label: isDa ? "Opsamlet" : "Captured", color: "bg-slate-600" },
    { id: "reviewing", label: isDa ? "Vurdering" : "Reviewing", color: "bg-blue-600" },
    { id: "contacting", label: isDa ? "Kontaktes" : "Contacting", color: "bg-yellow-600" },
    { id: "interviewing", label: isDa ? "Interview" : "Interviewing", color: "bg-indigo-600" },
    { id: "offer", label: isDa ? "Tilbud" : "Offer", color: "bg-emerald-600" },
    { id: "rejected", label: isDa ? "Afvist" : "Rejected", color: "bg-red-600" },
  ];
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/linkedin/candidate?limit=200");
      const data = await res.json();
      // Add default stage if not present
      const withStages = (data.candidates || []).map((c: any) => ({
        ...c,
        stage: c.stage || "captured",
      }));
      setCandidates(withStages);
      setError(null);
      toast.success(isDa ? "Pipeline opdateret" : "Pipeline refreshed");
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError(
        isDa
          ? "Kunne ikke indlæse kandidater. Prøv igen."
          : "Failed to load candidates. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const moveCandidate = async (candidateId: string, newStage: string) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === candidateId ? { ...c, stage: newStage } : c
      )
    );
    toast.success(
      isDa
        ? `Flyttet til ${STAGES.find(s => s.id === newStage)?.label}`
        : `Moved to ${STAGES.find(s => s.id === newStage)?.label}`
    );
    // Persist stage change to API
    try {
      await candidateService.updateStage(candidateId, newStage);
    } catch {
      // Best-effort — stage already updated optimistically
    }
  };

  const handleDragStart = (candidateId: string) => {
    setDraggedCandidate(candidateId);
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
  };

  const handleDrop = (stageId: string) => {
    if (draggedCandidate) {
      moveCandidate(draggedCandidate, stageId);
      setDraggedCandidate(null);
    }
  };

  const getCandidatesForStage = (stageId: string) =>
    candidates.filter(c => c.stage === stageId);

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation */}
        <LinkedInNav />
        
        {/* Header */}
        <PageHeader
          icon={Kanban}
          title={isDa ? "Rekrutteringspipeline" : "Recruiting Pipeline"}
          subtitle={
            isDa
              ? `Træk kandidater mellem faser • ${candidates.length} i alt`
              : `Drag candidates between stages • ${candidates.length} total`
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCandidates}
              disabled={loading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 focus-ring"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {isDa ? "Opdater" : "Refresh"}
            </Button>
          }
        />

        {/* Error Banner */}
        {error && <ErrorBanner message={error} onRetry={fetchCandidates} />}

        {loading ? (
          <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
            {STAGES.slice(0, 4).map((stage) => (
              <div key={stage.id} className="w-full lg:w-80 lg:flex-shrink-0">
                <SkeletonCard variant="kanban" />
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <LinkedInEmptyState type="pipeline" />
          </Card>
        ) : (
          /* Kanban Board */
          <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <div
                key={stage.id}
                className="w-full lg:w-80 lg:flex-shrink-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage.id)}
              >
                <Card className="bg-slate-900 border-slate-800 h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white body-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                        {stage.label}
                      </div>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                        {getCandidatesForStage(stage.id).length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[400px]">
                    <AnimatePresence>
                      {getCandidatesForStage(stage.id).map((candidate) => (
                        <motion.div
                          key={candidate.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          draggable
                          onDragStart={() => handleDragStart(candidate.id)}
                          onDragEnd={handleDragEnd}
                          tabIndex={0}
                          role="button"
                          aria-label={`${candidate.name}, ${candidate.headline}. Press Enter to view options.`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              // Open LinkedIn profile on Enter
                              window.open(candidate.linkedinUrl, '_blank');
                            }
                          }}
                          className={`
                            p-3 bg-slate-800 rounded-lg cursor-grab active:cursor-grabbing
                            border border-slate-700 hover:border-slate-600 transition-colors
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
                            ${draggedCandidate === candidate.id ? 'opacity-50' : ''}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <GripVertical className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                            
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              {candidate.photoUrl ? (
                                <img
                                  src={candidate.photoUrl}
                                  alt={candidate.name}
                                  className={`w-10 h-10 rounded-full object-cover ${candidate.openToWork ? 'ring-2 ring-green-500' : ''}`}
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-semibold body-sm ${candidate.openToWork ? 'ring-2 ring-green-500' : ''}`}>
                                  {getInitials(candidate.name)}
                                </div>
                              )}
                              {candidate.openToWork && (
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                                  <Zap className="w-2 h-2 text-white" />
                                </div>
                              )}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="body-sm font-medium text-white truncate">
                                {candidate.name}
                              </p>
                              <p className="caption text-slate-400 truncate">
                                {candidate.headline?.substring(0, 50)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {candidate.currentCompany && (
                                  <span className="caption text-slate-500 flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    {candidate.currentCompany.substring(0, 20)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <a
                              href={candidate.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={
                                isDa
                                  ? `Åbn ${candidate.name}s LinkedIn-profil`
                                  : `Open ${candidate.name}'s LinkedIn profile`
                              }
                            >
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </a>
                          </div>
                          
                          {/* Quick Actions - min-h-9 ensures 36px touch target */}
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-700">
                            {STAGES.filter(s => s.id !== stage.id && s.id !== 'captured').slice(0, 3).map(s => (
                              <button
                                key={s.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveCandidate(candidate.id, s.id);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.stopPropagation();
                                    moveCandidate(candidate.id, s.id);
                                  }
                                }}
                                className={`caption px-2 py-2 min-h-9 rounded ${s.color}/20 text-slate-300 hover:${s.color}/40 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                aria-label={
                                  isDa
                                    ? `Flyt ${candidate.name} til ${s.label}`
                                    : `Move ${candidate.name} to ${s.label}`
                                }
                              >
                                → {s.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {getCandidatesForStage(stage.id).length === 0 && (
                      <div className="text-center py-8 text-slate-600 body-sm">
                        {isDa ? "Slip kandidater her" : "Drop candidates here"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
