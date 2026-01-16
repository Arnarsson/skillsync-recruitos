"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Briefcase,
  Link as LinkIcon,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Linkedin,
  Users,
  Target,
  MessageSquare,
  FlaskConical,
  Coins,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const DEMO_JOB_CONTEXT = {
  title: "Senior Full-Stack Engineer",
  company: "FinTech Startup",
  location: "Copenhagen, Denmark (Hybrid)",
  experienceLevel: "5+ years",
  requiredSkills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
  preferredSkills: ["Payment Systems", "Python", "Redis", "Kubernetes"],
  summary: "Seeking an experienced Senior Full-Stack Engineer to join our growing fintech team. You will build scalable payment infrastructure, lead technical architecture decisions, and mentor junior developers.",
  rawText: `Role: Senior Full-Stack Engineer
Location: Copenhagen, Denmark (Hybrid - 3 days onsite)

Job Summary:
We are seeking an experienced Senior Full-Stack Engineer to join our growing fintech team. You will be responsible for building scalable payment infrastructure, leading technical architecture decisions, and mentoring junior developers.

Requirements:
- 5+ years of experience with TypeScript/JavaScript and React
- Strong backend experience with Node.js, Python, or Go
- Experience with PostgreSQL and Redis
- Familiarity with cloud infrastructure (AWS/GCP)
- Experience with payment systems or financial services (preferred)
- Strong communication skills and ability to work cross-functionally`
};

// Loading steps are now translated via t() calls

export default function IntakePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("url");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Progressive loading animation (4 steps)
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [loading]);

  // Social context fields
  const [companyUrl, setCompanyUrl] = useState("");
  const [managerUrl, setManagerUrl] = useState("");
  const [benchmarkUrl, setBenchmarkUrl] = useState("");

  const [calibration, setCalibration] = useState<{
    title: string;
    company: string;
    requiredSkills: string[];
    preferredSkills: string[];
    experienceLevel: string;
    location: string;
    summary: string;
  } | null>(null);

  const handleLoadDemo = () => {
    setCalibration(DEMO_JOB_CONTEXT);
    setCompanyUrl("https://linkedin.com/company/stripe");
  };

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
      toast.success("Job analyzed successfully", {
        description: `Found ${data.requiredSkills?.length || 0} required skills`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze job";
      console.error("Calibration error:", message);
      setError(message);
      toast.error("Analysis failed", { description: message });
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
      toast.success("Job analyzed successfully", {
        description: `Found ${data.requiredSkills?.length || 0} required skills`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze job";
      console.error("Calibration error:", message);
      setError(message);
      toast.error("Analysis failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (calibration) {
      // Add social context to calibration
      const enrichedContext = {
        ...calibration,
        socialContext: {
          companyUrl,
          managerUrl,
          benchmarkUrl,
        },
      };
      localStorage.setItem("apex_job_context", JSON.stringify(enrichedContext));
    }
    router.push("/pipeline");
  };

  const loadingSteps = [
    t("intake.loading.extracting"),
    t("intake.loading.identifying"),
    t("intake.loading.analyzing"),
    t("intake.loading.calibrating"),
  ];

  const steps = [
    { number: 1, name: t("intake.processPreview.steps.jobIntake"), description: t("intake.processPreview.steps.jobIntakeDesc"), active: true },
    { number: 2, name: t("intake.processPreview.steps.talentPipeline"), description: t("intake.processPreview.steps.talentPipelineDesc"), credits: 93 },
    { number: 3, name: t("intake.processPreview.steps.deepProfile"), description: t("intake.processPreview.steps.deepProfileDesc"), credits: 278 },
    { number: 4, name: t("intake.processPreview.steps.outreach"), description: t("intake.processPreview.steps.outreachDesc"), credits: 463 },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <Badge className="mb-2 bg-primary/20 text-primary">{t("intake.step")}</Badge>
                <h1 className="text-3xl font-bold mb-2">{t("intake.title")}</h1>
                <p className="text-muted-foreground max-w-2xl">
                  {t("intake.description")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLoadDemo} className="gap-2">
                <FlaskConical className="w-4 h-4" />
                {t("intake.loadDemo")}
              </Button>
            </div>

            {/* Social Context Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t("intake.socialContext.title")}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t("intake.socialContext.subtitle")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    {t("intake.socialContext.companyLinkedIn")}
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="https://linkedin.com/company/..."
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      {t("intake.socialContext.hiringManager")}
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        value={managerUrl}
                        onChange={(e) => setManagerUrl(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      {t("intake.socialContext.topPerformer")}
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        value={benchmarkUrl}
                        onChange={(e) => setBenchmarkUrl(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {t("intake.socialContext.note")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Job Requirements Card */}
            {!calibration ? (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t("intake.jobRequirements.title")}</CardTitle>
                      <p className="text-xs text-muted-foreground">{t("intake.jobRequirements.subtitle")}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="url" className="gap-2">
                        <LinkIcon className="w-4 h-4" />
                        {t("intake.jobRequirements.fromUrl")}
                      </TabsTrigger>
                      <TabsTrigger value="text" className="gap-2">
                        <FileText className="w-4 h-4" />
                        {t("intake.jobRequirements.pasteText")}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {t("intake.jobRequirements.jobPostingUrl")}
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://boards.greenhouse.io/..."
                            value={jobUrl}
                            onChange={(e) => setJobUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                            className="flex-1"
                            disabled={loading}
                          />
                          <Button
                            onClick={handleUrlSubmit}
                            disabled={loading || !jobUrl.trim()}
                            className="min-w-[120px]"
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            <span className="ml-2">{loading ? t("intake.jobRequirements.analyzing") : t("intake.jobRequirements.fetch")}</span>
                          </Button>
                        </div>
                        {loading && (
                          <motion.p
                            key={loadingStep}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-primary mt-2 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            {loadingSteps[loadingStep]}
                          </motion.p>
                        )}
                        {!loading && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t("intake.jobRequirements.urlHelp")}
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {t("intake.jobRequirements.jobDescription")}
                        </label>
                        <div className="relative">
                          <textarea
                            placeholder={t("intake.jobRequirements.pastePlaceholder")}
                            value={jobText}
                            onChange={(e) => setJobText(e.target.value)}
                            className="w-full h-48 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                            disabled={loading}
                          />
                          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground font-mono">
                            {jobText.length} {t("intake.jobRequirements.chars")}
                          </div>
                        </div>
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
                        {loading ? t("intake.jobRequirements.analyzing") : t("intake.jobRequirements.analyzeJob")}
                      </Button>
                      {loading && (
                        <motion.p
                          key={loadingStep}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-primary flex items-center gap-2 justify-center"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          {loadingSteps[loadingStep]}
                        </motion.p>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Error Display */}
                  {error && (
                    <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-500">{t("intake.error.title")}</p>
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
                        {t("intake.results.requiredSkills")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(calibration.requiredSkills || []).map((skill) => (
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
                        {t("intake.results.preferredSkills")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(calibration.preferredSkills || []).map((skill) => (
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
                      {t("intake.results.aiSummary")}
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
                    {t("intake.results.startOver")}
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 gap-2">
                    {t("intake.results.initializePipeline")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Process Preview Sidebar */}
          <div className="w-full lg:w-80 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {t("intake.processPreview.title")}
                  </CardTitle>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {steps.map((step, i) => (
                      <div key={step.number} className="relative flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium z-10 ${
                            step.active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {step.number}
                        </div>
                        <div className={step.active ? "" : "opacity-60"}>
                          <h4 className="text-sm font-medium">{step.name}</h4>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                          {step.credits && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                {step.credits} CR
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium">{t("intake.processPreview.creditSystem.title")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("intake.processPreview.creditSystem.description")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
