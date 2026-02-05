"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import { InterviewPrepKit, InterviewQuestion } from "@/lib/interviewPrep";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface InterviewPrepPanelProps {
  prepKit: InterviewPrepKit;
  className?: string;
}

const categoryColors: Record<InterviewQuestion["category"], string> = {
  technical: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  behavioral: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  project: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  architecture: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  collaboration: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const difficultyColors: Record<InterviewQuestion["difficulty"], string> = {
  easy: "text-green-400",
  medium: "text-amber-400",
  hard: "text-red-400",
};

function QuestionCard({ question, index }: { question: InterviewQuestion; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = `Question: ${question.question}\n\nContext: ${question.context}\n\nFollow-ups:\n${question.followUps.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <span className="text-zinc-500 font-mono text-sm">{String(index + 1).padStart(2, '0')}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded border",
              categoryColors[question.category]
            )}>
              {question.category}
            </span>
            <span className={cn("text-xs", difficultyColors[question.difficulty])}>
              {question.difficulty}
            </span>
          </div>
          <p className="text-white font-medium">{question.question}</p>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800/50">
          {/* Context */}
          <div className="mt-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <Lightbulb className="w-3 h-3" />
              Why ask this
            </div>
            <p className="text-sm text-zinc-300">{question.context}</p>
          </div>

          {/* Follow-ups */}
          {question.followUps.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-zinc-500 mb-2">Follow-up questions:</p>
              <ul className="space-y-1">
                {question.followUps.map((followUp, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                    <span className="text-zinc-600">→</span>
                    {followUp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Copy button */}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy question
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export function InterviewPrepPanel({ prepKit, className }: InterviewPrepPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedQuestions = showAll ? prepKit.questions : prepKit.questions.slice(0, 3);

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Interview Prep Kit</h3>
            <p className="text-xs text-zinc-500">
              {prepKit.totalQuestions} personalized questions based on their GitHub
            </p>
          </div>
        </div>
      </div>

      {/* Talking Points */}
      {prepKit.talkingPoints.length > 0 && (
        <div className="p-4 border-b border-zinc-800">
          <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-500" />
            Talking Points
          </h4>
          <div className="space-y-1">
            {prepKit.talkingPoints.map((point, i) => (
              <p key={i} className="text-sm text-zinc-400">{point}</p>
            ))}
          </div>
        </div>
      )}

      {/* Green/Red Flags */}
      {(prepKit.greenFlags.length > 0 || prepKit.redFlags.length > 0) && (
        <div className="p-4 border-b border-zinc-800 grid grid-cols-2 gap-4">
          {prepKit.greenFlags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Green Flags
              </h4>
              <ul className="space-y-1">
                {prepKit.greenFlags.map((flag, i) => (
                  <li key={i} className="text-xs text-zinc-400">✓ {flag}</li>
                ))}
              </ul>
            </div>
          )}
          {prepKit.redFlags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Watch For
              </h4>
              <ul className="space-y-1">
                {prepKit.redFlags.map((flag, i) => (
                  <li key={i} className="text-xs text-zinc-400">⚠ {flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-white mb-3">Questions to Ask</h4>
        <div className="space-y-2">
          {displayedQuestions.map((q, i) => (
            <QuestionCard key={i} question={q} index={i} />
          ))}
        </div>

        {prepKit.questions.length > 3 && (
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show less" : `Show all ${prepKit.questions.length} questions`}
          </Button>
        )}
      </div>
    </div>
  );
}
