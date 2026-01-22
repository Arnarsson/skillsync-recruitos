"use client";

import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  User,
  Copy,
  ExternalLink,
  Check,
  Sparkles,
  RefreshCw,
  Linkedin,
} from "lucide-react";
import { analyzeConnectionPath } from "@/services/geminiService";
import type { MatrixNode, ConnectionPath } from "@/types/socialMatrix";

interface WarmIntroRequestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  path: ConnectionPath;
  connector: MatrixNode;
  recruiterName: string;
  candidateName: string;
}

function getIntroQualityBadge(pathDegree: number, verificationStatus: string) {
  if (pathDegree === 1) {
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
        Direct Connection
      </Badge>
    );
  }

  if (verificationStatus === "verified") {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
        Warm Intro
      </Badge>
    );
  }

  return (
    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
      Potential Connection
    </Badge>
  );
}

export function WarmIntroRequest({
  open,
  onOpenChange,
  path,
  connector,
  recruiterName,
  candidateName,
}: WarmIntroRequestProps) {
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateMessage = useCallback(async () => {
    setIsGenerating(true);

    try {
      const pathData = {
        nodes: path.nodes.map(n => ({
          name: n.name,
          type: n.type,
          metadata: n.metadata,
        })),
        edges: path.edges.map(e => ({
          type: e.type,
          context: e.metadata?.context,
        })),
      };

      const analysis = await analyzeConnectionPath(pathData);

      // Build a message template
      const template = `Hi ${connector.name},

I hope this message finds you well! ${analysis.detailedExplanation}

I'm currently looking to connect with ${candidateName}, and I noticed ${analysis.outreachHook}

Would you be open to making a quick introduction? I'd really appreciate your help.

${analysis.commonGround.length > 0 ? `Some topics we could discuss: ${analysis.commonGround.slice(0, 2).join(", ")}` : ""}

Best regards,
${recruiterName}`;

      setMessage(template);
    } catch (error) {
      console.error("[WarmIntroRequest] Failed to generate message:", error);

      // Fallback template
      setMessage(`Hi ${connector.name},

I hope you're doing well! I noticed we're connected, and I was hoping you might be able to help me with an introduction.

I'm currently looking to connect with ${candidateName}, and I saw that you might know them through ${path.explanation}.

Would you be open to making a quick introduction? I'd really appreciate it.

Best regards,
${recruiterName}`);
    } finally {
      setIsGenerating(false);
    }
  }, [path, connector, recruiterName, candidateName]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [message]);

  const openLinkedIn = useCallback(() => {
    if (connector.profileUrl) {
      window.open(connector.profileUrl, "_blank", "noopener,noreferrer");
    }
  }, [connector.profileUrl]);

  const headlineValue = connector.metadata?.headline;
  const headlineText = typeof headlineValue === 'string' ? headlineValue : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Request Warm Introduction
          </SheetTitle>
          <SheetDescription>
            Ask {connector.name} to introduce you to {candidateName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {/* Connector Profile */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {connector.imageUrl ? (
                <img
                  src={connector.imageUrl}
                  alt={connector.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{connector.name}</p>
              {headlineText && (
                <p className="text-sm text-muted-foreground">
                  {headlineText}
                </p>
              )}
            </div>
            {getIntroQualityBadge(path.degree, path.verificationStatus)}
          </div>

          {/* Connection Context */}
          <div className="p-3 rounded-lg border border-border">
            <p className="text-xs uppercase text-muted-foreground mb-1">
              Connection Path
            </p>
            <p className="text-sm">{path.explanation}</p>
          </div>

          {/* Message Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Introduction Request Message</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateMessage}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your introduction request message..."
              className="min-h-[200px] resize-none"
            />
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={copyToClipboard}
            disabled={!message}
            className="w-full sm:w-auto"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Message
              </>
            )}
          </Button>

          {connector.profileUrl?.includes("linkedin.com") && (
            <Button
              onClick={openLinkedIn}
              className="w-full sm:w-auto bg-[#0A66C2] hover:bg-[#004182]"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              Open LinkedIn
            </Button>
          )}

          {connector.profileUrl && !connector.profileUrl.includes("linkedin.com") && (
            <Button
              onClick={openLinkedIn}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default WarmIntroRequest;
