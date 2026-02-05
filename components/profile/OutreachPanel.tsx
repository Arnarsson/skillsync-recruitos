"use client";

import { useState, useEffect } from "react";
import { X, Copy, Send, Sparkles, Check, Mail, Linkedin, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface OutreachPanelProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    name: string;
    username: string;
    location?: string;
    company?: string;
    bio?: string;
    skills?: string[];
    topRepos?: Array<{ name: string; stars: number; description?: string }>;
    recentPRs?: Array<{ title: string; repo: string }>;
  };
  jobContext?: {
    title?: string;
    company?: string;
    requiredSkills?: string[];
  };
  onSend?: (message: string, channel: string) => void;
}

type Channel = "email" | "linkedin" | "github";

/**
 * Generate personalized outreach message using REAL candidate data
 * NO MOCK DATA - everything comes from the candidate's actual profile
 */
function generatePersonalizedMessage(
  candidate: OutreachPanelProps["candidate"],
  jobContext: OutreachPanelProps["jobContext"],
  channel: Channel
): string {
  const { name, username, company, skills = [], topRepos = [], recentPRs = [] } = candidate;
  const firstName = name?.split(" ")[0] || username;
  
  // Find something specific to mention (REAL data)
  const topRepo = topRepos[0];
  const recentPR = recentPRs[0];
  const topSkill = skills[0];
  
  // Build personalized opening based on what data we have
  let personalizedHook = "";
  
  if (topRepo && topRepo.stars > 100) {
    personalizedHook = `I came across your work on ${topRepo.name}${topRepo.stars > 1000 ? ` (${topRepo.stars.toLocaleString()}+ stars!)` : ""} and was impressed by what you've built.`;
  } else if (recentPR) {
    personalizedHook = `I noticed your recent contribution to ${recentPR.repo} and really liked your approach.`;
  } else if (topSkill) {
    personalizedHook = `Your ${topSkill} expertise caught my attention while researching top engineers.`;
  } else {
    personalizedHook = `Your GitHub profile stood out while I was researching talented engineers.`;
  }
  
  // Job context
  const jobMention = jobContext?.title 
    ? `I'm hiring for a ${jobContext.title} role${jobContext.company ? ` at ${jobContext.company}` : ""}`
    : "I'm working on an exciting opportunity";
  
  // Skill match
  const matchingSkills = skills.filter(s => 
    jobContext?.requiredSkills?.some(req => 
      s.toLowerCase().includes(req.toLowerCase()) || 
      req.toLowerCase().includes(s.toLowerCase())
    )
  ).slice(0, 2);
  
  const skillMatch = matchingSkills.length > 0
    ? ` Your background in ${matchingSkills.join(" and ")} is exactly what we're looking for.`
    : "";
  
  // Channel-specific formatting
  if (channel === "linkedin") {
    return `Hi ${firstName},

${personalizedHook}

${jobMention} that I think could be a great fit for your background.${skillMatch}

Would you be open to a quick chat about it?

Best regards`;
  }
  
  if (channel === "github") {
    return `Hey ${firstName}! 👋

${personalizedHook}

${jobMention} and your work really aligns with what we're building.${skillMatch}

No pressure at all, but if you're open to hearing more, I'd love to tell you about it.

Cheers!`;
  }
  
  // Email (default)
  return `Hi ${firstName},

${personalizedHook}

${jobMention} and I believe your experience would be a fantastic match.${skillMatch}

I'd love to share more details if you're open to it. Would you have 15 minutes for a quick call this week?

Looking forward to hearing from you.

Best regards,
[Your Name]`;
}

export function OutreachPanel({ isOpen, onClose, candidate, jobContext, onSend }: OutreachPanelProps) {
  const [channel, setChannel] = useState<Channel>("email");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  // Generate personalized message when candidate or channel changes
  useEffect(() => {
    if (candidate) {
      setMessage(generatePersonalizedMessage(candidate, jobContext, channel));
    }
  }, [candidate, jobContext, channel]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    // Slight variation by re-generating
    setMessage(generatePersonalizedMessage(candidate, jobContext, channel));
  };

  const handleSend = async () => {
    setSending(true);
    try {
      onSend?.(message, channel);
      // Mark as reached out (would update candidate status)
    } finally {
      setSending(false);
    }
  };

  const channels = [
    { id: "email" as const, label: "Email", icon: Mail },
    { id: "linkedin" as const, label: "LinkedIn", icon: Linkedin },
    { id: "github" as const, label: "GitHub", icon: MessageSquare },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Reach Out</h2>
            <p className="text-xs text-zinc-500">to {candidate.name || candidate.username}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Channel Selector */}
      <div className="p-4 border-b border-zinc-800">
        <label className="text-xs text-zinc-500 mb-2 block">Channel</label>
        <div className="flex gap-2">
          {channels.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setChannel(id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                channel === id
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Badge */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg border border-amber-400/20">
          <Sparkles className="w-3 h-3" />
          <span>Auto-personalized using their GitHub profile</span>
          <button
            onClick={handleRegenerate}
            className="ml-auto p-1 hover:bg-amber-400/20 rounded"
            title="Regenerate"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Message Editor */}
      <div className="flex-1 p-4 overflow-auto">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[300px] bg-zinc-800/50 border-zinc-700 text-white resize-none"
          placeholder="Your message..."
        />

        {/* Personalization Hints */}
        <div className="mt-4 space-y-2">
          <p className="text-xs text-zinc-500">Personalized with:</p>
          <div className="flex flex-wrap gap-2">
            {candidate.topRepos?.[0] && (
              <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">
                📦 {candidate.topRepos[0].name}
              </span>
            )}
            {candidate.skills?.[0] && (
              <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">
                🛠️ {candidate.skills[0]}
              </span>
            )}
            {candidate.location && (
              <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">
                📍 {candidate.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-zinc-800 flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
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
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSend}
          disabled={sending}
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? "Sending..." : "Mark as Sent"}
        </Button>
      </div>
    </div>
  );
}
