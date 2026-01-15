"use client";

import { useState } from "react";
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
} from "lucide-react";

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    name: string;
    currentRole: string;
    company: string;
    avatar?: string;
  };
  jobContext?: {
    title?: string;
    company?: string;
    requiredSkills?: string[];
  };
}

export default function OutreachModal({
  isOpen,
  onClose,
  candidate,
  jobContext,
}: OutreachModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generateMessage = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to generate message");
      }

      setMessage(data.message);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate message";
      setError(errorMsg);
      console.error("Outreach error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleClose = () => {
    setMessage("");
    setError(null);
    setInstructions("");
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
            className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/20 text-primary">Step 4 of 4</Badge>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Generate Outreach
                </h2>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Candidate Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-6">
              {candidate.avatar && (
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h3 className="font-medium">{candidate.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {candidate.currentRole} at {candidate.company}
                </p>
              </div>
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
                className="w-full h-20 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            {/* Generate Button */}
            {!message && (
              <Button
                onClick={generateMessage}
                disabled={loading}
                className="w-full mb-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Crafting Message...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Outreach Message
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

            {/* Generated Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {message}
                  </pre>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={generateMessage}
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      // Open in LinkedIn
                      window.open(
                        `https://www.linkedin.com/messaging/compose/?recipient=${encodeURIComponent(candidate.name)}`,
                        "_blank"
                      );
                    }}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Open LinkedIn
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
