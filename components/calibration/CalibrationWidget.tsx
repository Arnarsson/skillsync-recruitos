"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bot,
  X,
  Send,
  User,
  Loader2,
  Sparkles,
  MessageSquare,
  CheckCircle,
  Circle,
  Briefcase,
  MapPin,
  Users,
  Clock,
  Target,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { specToJobContext } from "@/services/calibrationService";
import type {
  CalibrationMessage,
  HiringSpec,
} from "@/services/calibrationService";

export function CalibrationWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CalibrationMessage[]>([]);
  const [spec, setSpec] = useState<Partial<HiringSpec>>({});
  const [phase, setPhase] = useState<"gathering" | "refining" | "complete">(
    "gathering"
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showSpec, setShowSpec] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open && initialized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, initialized]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMessage: CalibrationMessage = {
        role: "user",
        content: text.trim(),
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setSuggestedQuestions([]);
      setLoading(true);

      try {
        const response = await fetch("/api/calibration/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            userMessage: text.trim(),
            currentSpec: spec,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Server error (${response.status})`
          );
        }

        const data = await response.json();

        const assistantMessage: CalibrationMessage = {
          role: "assistant",
          content: data.message,
        };

        setMessages([...updatedMessages, assistantMessage]);
        setSpec(data.spec || spec);
        setPhase(data.phase || "gathering");
        setSuggestedQuestions(data.suggestedQuestions || []);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Something went wrong";
        const errorMessage: CalibrationMessage = {
          role: "assistant",
          content: `Error: ${errorMsg}. Please try again.`,
        };
        setMessages([...updatedMessages, errorMessage]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [messages, spec, loading]
  );

  // Initialize on first open
  useEffect(() => {
    if (open && !initialized) {
      setInitialized(true);
      const welcome: CalibrationMessage = {
        role: "assistant",
        content:
          "Hi! Tell me about the role you're hiring for — paste a job description or describe it in a few words.",
      };
      setMessages([welcome]);
      setSuggestedQuestions([
        "Senior React developer",
        "Backend engineer, Python",
        "Full-stack lead, Copenhagen",
      ]);
    }
  }, [open, initialized]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleFinalize = () => {
    const jobContext = specToJobContext(spec);
    if (!jobContext.summary && spec.title) {
      jobContext.summary = `Looking for a ${spec.level || ""} ${spec.title}${
        spec.location?.preference ? ` in ${spec.location.preference}` : ""
      }${spec.location?.remote ? " (remote OK)" : ""}. Required skills: ${
        jobContext.requiredSkills.join(", ") || "TBD"
      }.`;
    }

    // Save to localStorage and navigate
    const enrichedContext = {
      ...jobContext,
      socialContext: { companyUrl: "", managerUrl: "", benchmarkUrl: "" },
    };
    localStorage.setItem("apex_job_context", JSON.stringify(enrichedContext));
    localStorage.removeItem("apex_job_context_hash");
    localStorage.removeItem("apex_skills_config");
    localStorage.removeItem("apex_skills_draft");
    localStorage.setItem("apex_pending_auto_search", "true");

    toast.success("Spec finalized", {
      description: `${jobContext.title} - ${jobContext.requiredSkills.length} required skills`,
    });

    setOpen(false);
    router.push("/skills-review");
  };

  // Spec field count
  let filledCount = 0;
  if (spec.title) filledCount++;
  if (spec.level) filledCount++;
  if (spec.skills && spec.skills.length > 0) filledCount++;
  if (spec.experience) filledCount++;
  if (spec.location) filledCount++;
  if (spec.teamContext) filledCount++;
  const canFinalize =
    phase === "refining" || phase === "complete" || filledCount >= 4;

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-colors"
          >
            <MessageSquare className="w-6 h-6" />
            {filledCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-[10px] font-bold flex items-center justify-center">
                {filledCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] rounded-2xl bg-zinc-900 border border-zinc-700/50 shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Hiring Assistant
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    {phase === "gathering" && "Gathering requirements..."}
                    {phase === "refining" && "Ready to finalize"}
                    {phase === "complete" && "Spec complete!"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {filledCount > 0 && (
                  <button
                    onClick={() => setShowSpec(!showSpec)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Toggle spec preview"
                  >
                    <Target className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Spec preview (collapsible) */}
            <AnimatePresence>
              {showSpec && filledCount > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-zinc-800"
                >
                  <div className="px-4 py-3 bg-zinc-800/50 space-y-2">
                    {/* Progress */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Hiring Spec
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {filledCount}/6
                      </span>
                    </div>
                    <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((filledCount / 6) * 100)}%`,
                        }}
                      />
                    </div>

                    {/* Filled fields */}
                    <div className="space-y-1.5">
                      {spec.title && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-zinc-300 truncate">
                            {spec.title}
                          </span>
                        </div>
                      )}
                      {spec.level && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-zinc-300">
                            {spec.level.charAt(0).toUpperCase() +
                              spec.level.slice(1)}
                          </span>
                        </div>
                      )}
                      {spec.experience && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-zinc-300">
                            {spec.experience.min}-{spec.experience.max} years
                          </span>
                        </div>
                      )}
                      {spec.location && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-zinc-300 truncate">
                            {spec.location.preference}
                            {spec.location.remote ? " (Remote)" : ""}
                          </span>
                        </div>
                      )}
                      {spec.skills && spec.skills.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {spec.skills.slice(0, 5).map((s) => (
                              <Badge
                                key={s.name}
                                variant="secondary"
                                className="text-[9px] px-1 py-0 h-4"
                              >
                                {s.name}
                              </Badge>
                            ))}
                            {spec.skills.length > 5 && (
                              <span className="text-zinc-500 text-[10px]">
                                +{spec.skills.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {spec.teamContext && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-zinc-300">
                            {spec.teamContext.size} people,{" "}
                            {spec.teamContext.role}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Finalize button */}
                    {canFinalize && (
                      <Button
                        onClick={handleFinalize}
                        size="sm"
                        className="w-full mt-2 gap-2 h-8 text-xs"
                      >
                        Finalize Spec
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-zinc-300" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-zinc-300" />
                  </div>
                  <div className="bg-zinc-800 rounded-2xl px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                    <span className="text-xs text-zinc-400">Thinking...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested questions */}
            {suggestedQuestions.length > 0 && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-1">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-300 hover:bg-indigo-500/15 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-zinc-800 px-3 py-3 flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the role..."
                disabled={loading}
                className="flex-1 h-9 text-sm bg-zinc-800 border-zinc-700"
                autoFocus
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                size="icon"
                className="h-9 w-9 flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
