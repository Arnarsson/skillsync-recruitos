"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Calculator, MessageSquare, FolderOpen } from "lucide-react";

interface Criterion {
  id: string;
  label: string;
  weight: number;
  description?: string;
}

interface CriteriaSet {
  id: string;
  name: string;
  role?: string | null;
  description?: string | null;
  criteria: Criterion[];
  updatedAt: string;
}

const makeCriterion = (): Criterion => ({
  id: `crit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  weight: 0.2,
  description: "",
});

export default function CriteriaPage() {
  const [sets, setSets] = useState<CriteriaSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Backend Engineer Scorecard");
  const [role, setRole] = useState("Backend Engineer");
  const [description, setDescription] = useState(
    "Structured criteria for evidence-based candidate evaluation."
  );
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: "code-quality", label: "Code quality", weight: 0.25, description: "Signal quality of technical output." },
    { id: "collaboration", label: "Collaboration", weight: 0.25, description: "Review activity and team interaction patterns." },
    { id: "ownership", label: "Ownership", weight: 0.25, description: "Initiative, follow-through, and accountability." },
    { id: "delivery", label: "Delivery cadence", weight: 0.25, description: "Consistency and sustained shipping behavior." },
  ]);
  const [evidenceText, setEvidenceText] = useState("");
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [interviewGuide, setInterviewGuide] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalWeight = useMemo(
    () => criteria.reduce((sum, c) => sum + (Number.isFinite(c.weight) ? c.weight : 0), 0),
    [criteria]
  );

  async function loadSets() {
    setLoading(true);
    try {
      const response = await fetch("/api/criteria");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load criteria sets");
      }
      setSets((data.criteriaSets || []).map((s: any) => ({ ...s, criteria: s.criteria || [] })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load criteria");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSets();
  }, []);

  function updateCriterion(index: number, patch: Partial<Criterion>) {
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function addCriterion() {
    setCriteria((prev) => [...prev, makeCriterion()]);
  }

  function removeCriterion(index: number) {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveSet() {
    setSaving(true);
    setError(null);
    try {
      const payload = { name, role, description, criteria };
      const response = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save criteria");
      await loadSets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save criteria");
    } finally {
      setSaving(false);
    }
  }

  async function runScore() {
    setError(null);
    try {
      const response = await fetch("/api/criteria/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria,
          evidenceText,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to score criteria");
      setScoreResult(data.scorecard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to score criteria");
    }
  }

  function loadSetIntoEditor(set: CriteriaSet) {
    setName(set.name);
    setRole(set.role || "");
    setDescription(set.description || "");
    setCriteria(set.criteria || []);
  }

  async function deleteSet(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/criteria/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete criteria set");
      await loadSets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete criteria set");
    }
  }

  async function generateInterviewGuide() {
    setError(null);
    try {
      const response = await fetch("/api/criteria/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: "Candidate",
          criteria,
          evidence: evidenceText
            ? [{ text: evidenceText, source: "manual-input" }]
            : [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate interview guide");
      setInterviewGuide(data.interviewGuide);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate interview guide");
    }
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Criteria Builder</h1>
            <p className="text-muted-foreground">
              Define hiring criteria before reviewing candidates to reduce bias.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-3 text-sm text-red-600">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Create Scorecard Template</CardTitle>
            <CardDescription>
              Build weighted criteria and reuse them as your decision baseline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-3">
              {criteria.map((criterion, index) => (
                <div key={criterion.id} className="grid md:grid-cols-12 gap-2 items-end border rounded-md p-3">
                  <div className="md:col-span-4 space-y-1">
                    <Label>Criterion</Label>
                    <Input
                      value={criterion.label}
                      onChange={(e) => updateCriterion(index, { label: e.target.value })}
                      placeholder="e.g. Collaboration"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label>Weight</Label>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={criterion.weight}
                      onChange={(e) =>
                        updateCriterion(index, { weight: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="md:col-span-5 space-y-1">
                    <Label>Description</Label>
                    <Input
                      value={criterion.description || ""}
                      onChange={(e) => updateCriterion(index, { description: e.target.value })}
                      placeholder="How this criterion is evaluated"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCriterion(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={addCriterion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Criterion
                </Button>
                <p className={`text-sm ${Math.abs(totalWeight - 1) < 0.001 ? "text-green-600" : "text-amber-600"}`}>
                  Total weight: {totalWeight.toFixed(2)} (target 1.00)
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveSet} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Criteria Set"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score Evidence Against Criteria</CardTitle>
            <CardDescription>
              Paste evidence to generate a weighted scorecard preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste candidate evidence text, PR highlights, activity notes, etc."
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              className="min-h-[140px]"
            />
            <Button onClick={runScore}>
              <Calculator className="w-4 h-4 mr-2" />
              Run Scorecard
            </Button>
            <Button variant="outline" onClick={generateInterviewGuide}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Generate Interview Guide
            </Button>

            {scoreResult && (
              <div className="border rounded-md p-4 space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Score</p>
                    <p className="text-2xl font-bold">{scoreResult.totalScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold">{Math.round(scoreResult.confidence * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Missing Data Penalty</p>
                    <p className="text-2xl font-bold">{scoreResult.missingDataPenalty}</p>
                  </div>
                </div>
              </div>
            )}

            {interviewGuide?.questions?.length ? (
              <div className="border rounded-md p-4 space-y-3">
                <p className="text-sm font-semibold">Interview Guide</p>
                <p className="text-xs text-muted-foreground">{interviewGuide.methodologyNote}</p>
                <div className="space-y-3">
                  {interviewGuide.questions.slice(0, 6).map((q: any, idx: number) => (
                    <div key={`${q.criterionId}-${idx}`} className="border rounded-md p-3 bg-muted/20">
                      <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">{q.whyItMatters}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Criteria Sets</CardTitle>
            <CardDescription>Reusable scorecard templates for your hiring loops.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : sets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No criteria sets saved yet.</p>
            ) : (
              <div className="space-y-3">
                {sets.map((set) => (
                  <div key={set.id} className="border rounded-md p-3">
                    <p className="font-medium">{set.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Role: {set.role || "n/a"} · Criteria: {set.criteria?.length || 0}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadSetIntoEditor(set)}
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteSet(set.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
