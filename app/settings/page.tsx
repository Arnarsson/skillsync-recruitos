"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Linkedin,
  Key,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  User,
  Clock,
  Trash2,
  ExternalLink,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

// ===== CONSTANTS =====

const CACHE_KEY_RECRUITER_URL = "recruitos_recruiter_linkedin";
const CACHE_KEY_RECRUITER_PROFILE = "recruitos_recruiter_linkedin_cache";
const CACHE_KEY_BRIGHTDATA = "BRIGHTDATA_API_KEY";
const CACHE_KEY_FIRECRAWL = "FIRECRAWL_API_KEY";
const CACHE_KEY_GEMINI = "GEMINI_API_KEY";

// ===== TYPES =====

interface RecruiterProfile {
  name: string;
  headline: string;
  profileUrl: string;
  profileImage?: string;
  connections: number;
  lastSynced: string;
  expiresAt: string;
}

// ===== COMPONENT =====

export default function SettingsPage() {
  const { lang } = useLanguage();
  const isDa = lang === "da";

  // State
  const [recruiterLinkedInUrl, setRecruiterLinkedInUrl] = useState("");
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [brightDataKey, setBrightDataKey] = useState("");
  const [firecrawlKey, setFirecrawlKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [linkedInSaveSuccess, setLinkedInSaveSuccess] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load API keys
    setBrightDataKey(localStorage.getItem(CACHE_KEY_BRIGHTDATA) || "");
    setFirecrawlKey(localStorage.getItem(CACHE_KEY_FIRECRAWL) || "");
    setGeminiKey(localStorage.getItem(CACHE_KEY_GEMINI) || "");

    // Load recruiter LinkedIn URL
    setRecruiterLinkedInUrl(localStorage.getItem(CACHE_KEY_RECRUITER_URL) || "");

    // Load cached recruiter profile
    try {
      const cached = localStorage.getItem(CACHE_KEY_RECRUITER_PROFILE);
      if (cached) {
        const data = JSON.parse(cached);
        setRecruiterProfile({
          name: data.profile?.name || "",
          headline: data.profile?.headline || "",
          profileUrl: data.profile?.profileUrl || "",
          profileImage: data.profile?.profileImage,
          connections: data.connectionUrls?.length || data.profile?.connectionCount || 0,
          lastSynced: data.lastSynced || "",
          expiresAt: data.expiresAt || "",
        });
      }
    } catch (error) {
      console.error("Failed to load cached profile:", error);
    }
  }, []);

  // Save API keys
  const handleSaveApiKeys = () => {
    if (typeof window === "undefined") return;

    if (brightDataKey.trim()) {
      localStorage.setItem(CACHE_KEY_BRIGHTDATA, brightDataKey.trim());
    } else {
      localStorage.removeItem(CACHE_KEY_BRIGHTDATA);
    }

    if (firecrawlKey.trim()) {
      localStorage.setItem(CACHE_KEY_FIRECRAWL, firecrawlKey.trim());
    } else {
      localStorage.removeItem(CACHE_KEY_FIRECRAWL);
    }

    if (geminiKey.trim()) {
      localStorage.setItem(CACHE_KEY_GEMINI, geminiKey.trim());
    } else {
      localStorage.removeItem(CACHE_KEY_GEMINI);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Save LinkedIn URL
  const handleSaveLinkedInUrl = () => {
    if (typeof window === "undefined") return;

    if (recruiterLinkedInUrl.trim()) {
      localStorage.setItem(CACHE_KEY_RECRUITER_URL, recruiterLinkedInUrl.trim());
    } else {
      localStorage.removeItem(CACHE_KEY_RECRUITER_URL);
    }

    setLinkedInSaveSuccess(true);
    setTimeout(() => setLinkedInSaveSuccess(false), 3000);
  };

  // Sync LinkedIn connections
  const handleSyncConnections = async () => {
    if (!recruiterLinkedInUrl) {
      setSyncError(
        isDa
          ? "Indtast først din LinkedIn-URL"
          : "Please enter your LinkedIn URL first"
      );
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Save the URL first
      localStorage.setItem(CACHE_KEY_RECRUITER_URL, recruiterLinkedInUrl.trim());

      // Make API call to scrape profile (server uses env var if no client key)
      const response = await fetch("/api/linkedin-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recruiterLinkedInUrl: recruiterLinkedInUrl,
          candidateLinkedInUrl: recruiterLinkedInUrl, // Scrape self to get connections
          apiKey: brightDataKey || undefined, // Server will use BRIGHTDATA_API_KEY from env
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || (isDa ? "Kunne ikke synkronisere profil" : "Failed to sync profile")
        );
      }

      const data = await response.json();

      // Extract and save the recruiter profile
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const profileData = {
        profile: data.recruiterProfile,
        connectionUrls: [], // Will be populated from the scrape
        lastSynced: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      localStorage.setItem(CACHE_KEY_RECRUITER_PROFILE, JSON.stringify(profileData));

      setRecruiterProfile({
        name: data.recruiterProfile.name,
        headline: data.recruiterProfile.headline,
        profileUrl: data.recruiterProfile.profileUrl,
        profileImage: data.recruiterProfile.profileImage,
        connections: data.recruiterProfile.connections,
        lastSynced: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("Sync error:", error);
      setSyncError(
        error instanceof Error
          ? error.message
          : isDa
            ? "Kunne ikke synkronisere forbindelser"
            : "Failed to sync connections"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear cached profile
  const handleClearCache = () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem(CACHE_KEY_RECRUITER_PROFILE);
    setRecruiterProfile(null);
  };

  // Check if profile cache is expired
  const isCacheExpired = recruiterProfile?.expiresAt
    ? new Date(recruiterProfile.expiresAt) < new Date()
    : false;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{isDa ? "Indstillinger" : "Settings"}</h1>
              <p className="text-muted-foreground mt-1">
                {isDa
                  ? "Konfigurer dine RecruitOS-integrationer"
                  : "Configure your RecruitOS integrations"}
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">{isDa ? "Tilbage til forsiden" : "Back to Home"}</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* LinkedIn Connection Path Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                {isDa ? "LinkedIn-forbindelsessti" : "LinkedIn Connection Path"}
              </CardTitle>
              <CardDescription>
                {isDa
                  ? "Indtast URL'en til din LinkedIn-profil for at se, hvordan du er forbundet til kandidater. Det aktiverer forbindelsessti-funktionen på kandidatprofiler."
                  : "Enter your LinkedIn profile URL to discover how you're connected to candidates. This enables the connection path feature on candidate profiles."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* LinkedIn URL Input */}
              <div className="space-y-2">
                <Label htmlFor="linkedin-url">
                  {isDa ? "Din LinkedIn-profil URL" : "Your LinkedIn Profile URL"}
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="linkedin-url"
                    type="url"
                    placeholder="https://www.linkedin.com/in/your-profile"
                    value={recruiterLinkedInUrl}
                    onChange={(e) => setRecruiterLinkedInUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSaveLinkedInUrl}
                    disabled={!recruiterLinkedInUrl}
                  >
                    {linkedInSaveSuccess ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        {isDa ? "Gemt!" : "Saved!"}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isDa ? "Gem" : "Save"}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isDa ? "Eksempel: https://www.linkedin.com/in/johndoe" : "Example: https://www.linkedin.com/in/johndoe"}
                </p>
              </div>

              <Separator />

              {/* Synced Profile Display */}
              {recruiterProfile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {isDa ? "Synkroniseret profil" : "Synced Profile"}
                    </span>
                    <div className="flex items-center gap-2">
                      {isCacheExpired && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {isDa ? "Udløbet" : "Expired"}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCache}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                    {recruiterProfile.profileImage ? (
                      <img
                        src={recruiterProfile.profileImage}
                        alt={recruiterProfile.name}
                        className="w-14 h-14 rounded-full border-2 border-[#0A66C2]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-[#0A66C2]">
                        <User className="w-7 h-7 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{recruiterProfile.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {recruiterProfile.headline}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          {recruiterProfile.connections}+ {isDa ? "forbindelser" : "connections"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {isDa ? "Synkroniseret" : "Synced"}{" "}
                          {new Date(recruiterProfile.lastSynced).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {recruiterProfile.profileUrl && (
                      <a
                        href={recruiterProfile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{isDa ? "Ingen profil synkroniseret endnu" : "No profile synced yet"}</p>
                </div>
              )}

              {/* Sync Button */}
              <Button
                onClick={handleSyncConnections}
                disabled={isSyncing || !recruiterLinkedInUrl}
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {isDa ? "Synkroniserer forbindelser..." : "Syncing Connections..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {recruiterProfile
                      ? isDa
                        ? "Opdater forbindelser"
                        : "Refresh Connections"
                      : isDa
                        ? "Synkroniser mine forbindelser"
                        : "Sync My Connections"}
                  </>
                )}
              </Button>

              {/* Error Display */}
              {syncError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{syncError}</span>
                </div>
              )}

              {/* Info Box */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  {isDa
                    ? "Dine LinkedIn-profildata gemmes lokalt i din browser og sendes aldrig til vores servere. Forbindelsesstier beregnes i klienten."
                    : "Your LinkedIn profile data is stored locally in your browser and never sent to our servers. Connection paths are calculated client-side."}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Keys Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                {isDa ? "API-nøgler" : "API Keys"}
              </CardTitle>
              <CardDescription>
                {isDa
                  ? "Konfigurer dine API-nøgler til forskellige integrationer. Nøgler gemmes sikkert i browserens lokale lager."
                  : "Configure your API keys for various integrations. Keys are stored securely in your browser's local storage."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* BrightData API Key */}
              <div className="space-y-2">
                <Label htmlFor="brightdata-key">BrightData API Key</Label>
                <Input
                  id="brightdata-key"
                  type="password"
                  placeholder={isDa ? "Indtast din BrightData API-nøgle" : "Enter your BrightData API key"}
                  value={brightDataKey}
                  onChange={(e) => setBrightDataKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {isDa
                    ? "Kræves til scraping af LinkedIn-profiler og forbindelsesstier."
                    : "Required for LinkedIn profile scraping and connection paths."}{" "}
                  <a
                    href="https://brightdata.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {isDa ? "Få en API-nøgle" : "Get an API key"}
                  </a>
                </p>
              </div>

              {/* Firecrawl API Key */}
              <div className="space-y-2">
                <Label htmlFor="firecrawl-key">Firecrawl API Key</Label>
                <Input
                  id="firecrawl-key"
                  type="password"
                  placeholder={isDa ? "Indtast din Firecrawl API-nøgle" : "Enter your Firecrawl API key"}
                  value={firecrawlKey}
                  onChange={(e) => setFirecrawlKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {isDa
                    ? "Kræves til jobbeskrivelses- og websidescraping."
                    : "Required for job description and website scraping."}{" "}
                  <a
                    href="https://firecrawl.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {isDa ? "Få en API-nøgle" : "Get an API key"}
                  </a>
                </p>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-2">
                <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder={isDa ? "Indtast din Gemini API-nøgle" : "Enter your Gemini API key"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {isDa
                    ? "Kræves til AI-drevet kandidatanalyse."
                    : "Required for AI-powered candidate analysis."}{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {isDa ? "Få en API-nøgle" : "Get an API key"}
                  </a>
                </p>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveApiKeys}>
                  <Save className="w-4 h-4 mr-2" />
                  {isDa ? "Gem API-nøgler" : "Save API Keys"}
                </Button>
                {saveSuccess && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1 text-sm text-green-600"
                  >
                    <Check className="w-4 h-4" />
                    {isDa ? "Gemt!" : "Saved!"}
                  </motion.span>
                )}
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  {isDa
                    ? "API-nøgler gemmes kun i browserens lokale lager og sendes aldrig til vores servere. De bruges direkte i API-kald fra din browser."
                    : "API keys are stored only in your browser's local storage and are never transmitted to our servers. They are used directly in API calls from your browser."}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Credit Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {isDa ? "Credits og forbrug" : "Credits & Usage"}
              </CardTitle>
              <CardDescription>
                {isDa ? "Overvåg din creditsaldo og API-forbrug." : "Monitor your credit balance and API usage."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {isDa ? "Nuværende saldo" : "Current Balance"}
                  </div>
                  <div className="text-3xl font-bold">
                    {typeof window !== "undefined"
                      ? localStorage.getItem("apex_credits") || "5000"
                      : "5000"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isDa ? "credits" : "credits"}
                  </div>
                </div>
                <Link href="/pricing">
                  <Button variant="outline">
                    {isDa ? "Køb flere credits" : "Get More Credits"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
