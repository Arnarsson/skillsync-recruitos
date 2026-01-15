"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Link as LinkIcon,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function IntakePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("url");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<{
    title: string;
    company: string;
    requiredSkills: string[];
    preferredSkills: string[];
    experienceLevel: string;
    location: string;
    summary: string;
  } | null>(null);

  const handleUrlSubmit = async () => {
    if (!jobUrl.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "url", url: jobUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to analyze job");
      }

      setCalibration(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze job";
      console.error("Calibration error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!jobText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "text", text: jobText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to analyze job");
      }

      setCalibration(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze job";
      console.error("Calibration error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Store calibration in localStorage for pipeline
    if (calibration) {
      localStorage.setItem("apex_job_context", JSON.stringify(calibration));
    }
    router.push("/pipeline");
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary">Step 1 of 4</Badge>
          <h1 className="text-4xl font-bold mb-4">Job Calibration</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start by defining the role you&apos;re hiring for. Our AI will analyze the
            job requirements to help find the best candidates.
          </p>
        </div>

        {/* Input Section */}
        {!calibration ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Add Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="url" className="gap-2">
                    <LinkIcon className="w-4 h-4" />
                    From URL
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Paste Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Job Posting URL
                    </label>
                    <Input
                      placeholder="https://careers.example.com/job/senior-engineer"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Works with LinkedIn, Greenhouse, Lever, and most job boards
                    </p>
                  </div>
                  <Button
                    onClick={handleUrlSubmit}
                    disabled={loading || !jobUrl.trim()}
                    className="w-full gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Analyze Job Posting
                  </Button>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Job Description
                    </label>
                    <textarea
                      placeholder="Paste the full job description here..."
                      value={jobText}
                      onChange={(e) => setJobText(e.target.value)}
                      className="w-full h-64 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <Button
                    onClick={handleTextSubmit}
                    disabled={loading || !jobText.trim()}
                    className="w-full gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Analyze Job Description
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-500">Analysis Failed</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Calibration Results */
          <div className="space-y-6">
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {calibration.title}
                    </h3>
                    <p className="text-muted-foreground">{calibration.company}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{calibration.experienceLevel}</Badge>
                      <Badge variant="outline">{calibration.location}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Required Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {calibration.requiredSkills.map((skill) => (
                      <Badge key={skill} className="bg-primary/20 text-primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Preferred Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {calibration.preferredSkills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{calibration.summary}</p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCalibration(null)}
                className="flex-1"
              >
                Start Over
              </Button>
              <Button onClick={handleContinue} className="flex-1 gap-2">
                Continue to Pipeline
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
