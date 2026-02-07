"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

interface SendEmailFormProps {
  /** Pre-filled subject line */
  defaultSubject?: string;
  /** Pre-filled email body (plain text) */
  defaultBody?: string;
  /** Candidate name for display */
  candidateName?: string;
  /** Prisma candidate ID -- if provided, pipeline stage will be updated to "outreached" on send */
  candidateId?: string;
  /** Called after successful send */
  onSuccess?: () => void;
  /** Called to close/dismiss the form */
  onClose?: () => void;
}

export default function SendEmailForm({
  defaultSubject = "",
  defaultBody = "",
  candidateName,
  candidateId,
  onSuccess,
  onClose,
}: SendEmailFormProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          body,
          candidateId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Send failed");
      }

      setStatus("success");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to send email"
      );
    } finally {
      setSending(false);
    }
  };

  if (status === "success") {
    return (
      <div className="p-6 text-center space-y-3">
        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
        <h3 className="text-lg font-semibold">Email Sent</h3>
        <p className="text-sm text-muted-foreground">
          Your outreach email to{" "}
          <span className="font-medium text-foreground">{to}</span> has been
          delivered.
        </p>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">
            Send Email
            {candidateName && (
              <span className="text-muted-foreground font-normal">
                {" "}
                to {candidateName}
              </span>
            )}
          </h3>
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* To */}
      <div>
        <label className="block text-xs font-medium mb-1 text-muted-foreground">
          Recipient Email
        </label>
        <Input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="candidate@example.com"
          required
        />
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-medium mb-1 text-muted-foreground">
          Subject
        </label>
        <Input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Exciting opportunity..."
          required
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-medium mb-1 text-muted-foreground">
          Message
        </label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[200px] resize-y"
          placeholder="Your outreach message..."
          required
        />
      </div>

      {/* Error */}
      {status === "error" && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-500">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <Button type="submit" disabled={sending} className="w-full">
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </>
        )}
      </Button>
    </form>
  );
}
