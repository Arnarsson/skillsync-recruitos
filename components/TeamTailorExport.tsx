"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { RecruitOSProfile } from "@/lib/teamtailor";

interface TeamTailorExportProps {
  profiles: RecruitOSProfile[];
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  buttonSize?: "default" | "sm" | "lg";
}

export default function TeamTailorExport({
  profiles,
  buttonLabel = "Export to Team Tailor",
  buttonVariant = "outline",
  buttonSize = "default",
}: TeamTailorExportProps) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [exportResult, setExportResult] = useState<{
    successful: number;
    failed: number;
    errors: Array<{ username: string; error: string }>;
  } | null>(null);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: "Please enter an API key" });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/teamtailor/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleExport = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: "Please enter an API key" });
      return;
    }

    setLoading(true);
    setExportResult(null);

    try {
      const response = await fetch("/api/teamtailor/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          profiles,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setExportResult(result);
      } else {
        setTestResult({
          success: false,
          message: result.error || "Export failed",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setApiKey("");
    setTestResult(null);
    setExportResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Upload className="mr-2 h-4 w-4" />
          {buttonLabel}
          {profiles.length > 1 && (
            <Badge variant="secondary" className="ml-2">
              {profiles.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export to Team Tailor</DialogTitle>
          <DialogDescription>
            Export {profiles.length} candidate{profiles.length !== 1 ? "s" : ""} to your Team Tailor ATS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">Team Tailor API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || loading || !apiKey.trim()}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing
                  </>
                ) : (
                  "Test"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Find your API key in Team Tailor settings → Integrations
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Export Result */}
          {exportResult && (
            <div className="space-y-2">
              <Alert variant={exportResult.failed > 0 ? "destructive" : "default"}>
                {exportResult.failed === 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Successfully exported {exportResult.successful} candidate
                      {exportResult.successful !== 1 ? "s" : ""}!
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {exportResult.successful > 0 && (
                        <div className="mb-2">
                          ✓ {exportResult.successful} successful
                        </div>
                      )}
                      <div>✗ {exportResult.failed} failed</div>
                    </AlertDescription>
                  </>
                )}
              </Alert>

              {/* Show errors if any */}
              {exportResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {exportResult.errors.map((err, idx) => (
                    <div key={idx} className="text-destructive">
                      <strong>{err.username}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Candidate List */}
          <div className="space-y-2">
            <Label>Candidates to export:</Label>
            <div className="max-h-40 overflow-y-auto space-y-1 text-sm border rounded-md p-2">
              {profiles.map((profile, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>{profile.name || profile.username}</span>
                  <Badge variant="outline" className="text-xs">
                    @{profile.username}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {exportResult ? "Close" : "Cancel"}
          </Button>
          {!exportResult && (
            <Button
              onClick={handleExport}
              disabled={loading || !apiKey.trim() || !testResult?.success}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  Export {profiles.length} Candidate{profiles.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </DialogFooter>

        {/* Help Link */}
        <div className="text-center text-xs text-muted-foreground">
          <a
            href="https://docs.teamtailor.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            Team Tailor API Documentation
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
