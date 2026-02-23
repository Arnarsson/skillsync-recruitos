"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/adminContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  Send,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Briefcase,
  Heart,
  Code,
  Star,
  ExternalLink,
  Mail,
} from "lucide-react";
import SendEmailForm from "@/components/outreach/SendEmailForm";

interface OutreachVariant {
  tone: "professional" | "warm" | "technical";
  name: string;
  description: string;
  message: string;
  isRecommended: boolean;
  error?: string;
}

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    name: string;
    currentRole: string;
    company: string;
    avatar?: string;
    linkedinUrl?: string;
    candidateId?: string;
    persona?: {
      archetype?: string;
    };
  };
  jobContext?: {
    title?: string;
    company?: string;
    requiredSkills?: string[];
  };
}

const TONE_ICONS = {
  professional: Briefcase,
  warm: Heart,
  technical: Code,
};

const TONE_COLORS = {
  professional: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
  warm: "from-pink-500/20 to-rose-600/20 border-pink-500/30",
  technical: "from-green-500/20 to-emerald-600/20 border-green-500/30",
};

export default function OutreachModal({
  isOpen,
  onClose,
  candidate,
  jobContext,
}: OutreachModalProps) {
  const [variants, setVariants] = useState<OutreachVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedTone, setCopiedTone] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailFormTone, setEmailFormTone] = useState<string | null>(null);
  const { isDemoMode } = useAdmin();

  const generateMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isDemoMode) {
        headers["x-demo-mode"] = "true";
      }
      const response = await fetch("/api/outreach", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          candidateName: candidate.name,
          candidateRole: candidate.currentRole,
          company: candidate.company,
          jobContext: jobContext
            ? `${jobContext.title || "Open Position"} at ${jobContext.company || "Our Company"}. Skills: ${jobContext.requiredSkills?.join(", ") || "Various"}`
            : "Open recruiting position",
          instructions:
            instructions ||
            "Write a professional, personalized outreach message. Be friendly but not too casual.",
          personaArchetype: candidate.persona?.archetype,
          multiVariant: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please sign in to generate outreach messages.");
        }
        throw new Error(data.details || data.error || "Failed to generate messages");
      }

      setVariants(data.variants);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate messages";
      setError(errorMsg);
      console.error("Outreach error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (message: string, tone: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedTone(tone);
      setTimeout(() => setCopiedTone(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const openLinkedIn = () => {
    // Use actual LinkedIn URL if available, otherwise search by name
    const linkedInUrl = candidate.linkedinUrl
      ? candidate.linkedinUrl
      : `https://linkedin.com/search/results/all/?keywords=${encodeURIComponent(candidate.name)}`;
    window.open(linkedInUrl, "_blank");
  };

  const handleClose = () => {
    setVariants([]);
    setError(null);
    setInstructions("");
    setEmailFormTone(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-lg p-4 sm:p-6 max-w-5xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Badge className="bg-primary/20 text-primary text-xs sm:text-sm">Step 4 of 4</Badge>
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Generate Outreach</span>
                  <span className="sm:hidden">Outreach</span>
                </h2>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Candidate Info */}
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg mb-4 sm:mb-6">
              {candidate.avatar && (
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{candidate.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {candidate.currentRole} at {candidate.company}
                </p>
              </div>
              {candidate.persona?.archetype && (
                <Badge variant="outline" className="hidden sm:flex text-xs">
                  {candidate.persona.archetype.split(" ").slice(0, 3).join(" ")}
                </Badge>
              )}
            </div>

            {/* Instructions */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Custom Instructions (optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g., Mention our company culture, focus on growth opportunities, keep it brief..."
                className="w-full h-16 sm:h-20 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background"
              />
            </div>

            {/* Generate Button */}
            {variants.length === 0 && (
              <Button
                onClick={generateMessages}
                disabled={loading}
                className="w-full mb-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating 3 Variants...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Outreach Messages
                  </>
                )}
              </Button>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Generated Message Variants */}
            {variants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Regenerate Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={generateMessages}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate All
                      </>
                    )}
                  </Button>
                </div>

                {/* Three Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {variants.map((variant) => {
                    const Icon = TONE_ICONS[variant.tone];
                    const colorClass = TONE_COLORS[variant.tone];
                    const isCopied = copiedTone === variant.tone;

                    return (
                      <motion.div
                        key={variant.tone}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative rounded-lg border-2 bg-gradient-to-br ${colorClass} p-4 flex flex-col`}
                      >
                        {/* Recommended Badge */}
                        {variant.isRecommended && (
                          <div className="absolute -top-2 -right-2">
                            <Badge className="bg-yellow-500 text-yellow-950 text-xs flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Recommended
                            </Badge>
                          </div>
                        )}

                        {/* Card Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 rounded-full bg-background/50">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{variant.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {variant.description}
                            </p>
                          </div>
                        </div>

                        {/* Message Content */}
                        {variant.error ? (
                          <div className="flex-1 p-3 bg-red-500/10 rounded-lg text-sm text-red-500">
                            Failed to generate: {variant.error}
                          </div>
                        ) : (
                          <div className="flex-1 p-3 bg-background/70 rounded-lg mb-3 overflow-auto max-h-48 lg:max-h-64">
                            <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">
                              {variant.message}
                            </pre>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!variant.error && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => copyToClipboard(variant.message, variant.tone)}
                                variant={isCopied ? "default" : "outline"}
                                size="sm"
                                className="flex-1"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-4 h-4 mr-2 text-green-500" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() =>
                                  setEmailFormTone(
                                    emailFormTone === variant.tone ? null : variant.tone
                                  )
                                }
                                variant={emailFormTone === variant.tone ? "default" : "outline"}
                                size="sm"
                                className="flex-1"
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </Button>
                            </div>

                            {/* Inline Email Form */}
                            {emailFormTone === variant.tone && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-background rounded-lg p-3 border"
                              >
                                <SendEmailForm
                                  defaultSubject={`Opportunity for ${candidate.name}`}
                                  defaultBody={variant.message}
                                  candidateName={candidate.name}
                                  candidateId={candidate.candidateId}
                                  onSuccess={() => setEmailFormTone(null)}
                                  onClose={() => setEmailFormTone(null)}
                                />
                              </motion.div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* LinkedIn Action */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={openLinkedIn}
                    className="w-full sm:w-auto"
                    variant="default"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Open LinkedIn
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                  {!candidate.linkedinUrl && (
                    <p className="text-xs text-muted-foreground mt-2">
                      LinkedIn profile not found - will search by name
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
