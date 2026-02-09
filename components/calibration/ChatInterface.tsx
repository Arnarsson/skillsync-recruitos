"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SpecPreview } from "./SpecPreview";
import { specToJobContext } from "@/services/calibrationService";
import type {
  CalibrationMessage,
  HiringSpec,
} from "@/services/calibrationService";

interface ChatInterfaceProps {
  /** Called when the user finalizes the spec — passes the job context in existing format */
  onSpecFinalized: (jobContext: {
    title: string;
    company: string;
    requiredSkills: string[];
    preferredSkills: string[];
    experienceLevel: string;
    location: string;
    summary: string;
  }) => void;
  /** Optional initial text (e.g., pasted job description) to kick off the conversation */
  initialInput?: string;
}

export function ChatInterface({
  onSpecFinalized,
  initialInput,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<CalibrationMessage[]>([]);
  const [spec, setSpec] = useState<Partial<HiringSpec>>({});
  const [phase, setPhase] = useState<"gathering" | "refining" | "complete">(
    "gathering"
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          credentials: "include", // Send auth cookies
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
          content: `I encountered an error: ${errorMsg}. Please try again.`,
        };
        setMessages([...updatedMessages, errorMessage]);
      } finally {
        setLoading(false);
        // Refocus input after response
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [messages, spec, loading]
  );

  // Kick off conversation on mount
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    if (initialInput && initialInput.trim()) {
      // User provided a job description — send it as first message
      sendMessage(initialInput.trim());
    } else {
      // No input — show a welcome message from the AI
      const welcome: CalibrationMessage = {
        role: "assistant",
        content:
          "Hi! I am your hiring spec assistant. Tell me about the role you are looking to fill — you can paste a job description, or just describe the role in a few words.",
      };
      setMessages([welcome]);
      setSuggestedQuestions([
        "Senior React developer",
        "Backend engineer, Python",
        "Full-stack lead, Copenhagen",
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleFinalize = () => {
    const jobContext = specToJobContext(spec);
    // Generate a summary if missing
    if (!jobContext.summary && spec.title) {
      jobContext.summary = `Looking for a ${spec.level || ""} ${spec.title}${
        spec.location?.preference ? ` in ${spec.location.preference}` : ""
      }${spec.location?.remote ? " (remote OK)" : ""}. Required skills: ${
        jobContext.requiredSkills.join(", ") || "TBD"
      }.`;
    }
    onSpecFinalized(jobContext);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-[300px] max-h-[500px]">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2.5 justify-start"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-slate-300" />
                </div>
                <div className="bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Thinking...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested quick replies */}
          {suggestedQuestions.length > 0 && !loading && (
            <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="border-t p-3 sm:p-4 flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the role or answer the question..."
              disabled={loading}
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              size="icon"
              className="flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </Card>

        {/* Phase indicator */}
        <div className="flex items-center gap-2 mt-2 px-1">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {phase === "gathering" && "Gathering requirements..."}
            {phase === "refining" && "Refining spec - ready to finalize"}
            {phase === "complete" && "Spec complete!"}
          </span>
        </div>
      </div>

      {/* Spec preview panel */}
      <div className="w-full lg:w-72 lg:sticky lg:top-24 lg:self-start">
        <SpecPreview spec={spec} phase={phase} onFinalize={handleFinalize} />
      </div>
    </div>
  );
}
