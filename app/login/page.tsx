"use client";

import { signIn } from "next-auth/react";
import { Github, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleGitHubLogin = () => {
    signIn("github", { callbackUrl: "/intake" });
  };

  const handleDemoMode = () => {
    // Enable demo mode in localStorage
    localStorage.setItem("recruitos_demo_mode", "true");
    localStorage.setItem("recruitos_admin_mode", "true");

    // Set cookie so middleware can bypass auth for demo mode
    document.cookie = "recruitos_demo=true; path=/; max-age=86400; SameSite=Lax";

    // Navigate to intake page with demo data
    router.push("/intake?demo=true");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#141517] font-bold text-xl">S</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t("login.welcomeBack")}</h1>
          <p className="text-gray-400">
            {t("login.subtitle")}
          </p>
        </div>

        <div className="bg-[#1a1b1e] rounded-2xl border border-white/10 p-8 space-y-4">
          {/* Demo Button - Prominent */}
          <Button
            size="lg"
            onClick={handleDemoMode}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
          >
            <Play className="w-5 h-5" />
            {t("login.tryDemo")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1b1e] px-2 text-gray-500">{t("login.or")}</span>
            </div>
          </div>

          {/* GitHub Login */}
          <Button
            size="lg"
            onClick={handleGitHubLogin}
            className="w-full bg-white dark:bg-white text-[#141517] hover:bg-gray-200 dark:hover:bg-gray-200 border-transparent"
          >
            <Github className="w-5 h-5" />
            {t("login.continueWithGithub")}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t("login.noAccount")}{" "}
            <Link href="/signup" className="text-white hover:underline">
              {t("login.signUp")}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          {t("login.bySigningIn")}{" "}
          <Link href="/terms" className="text-gray-400 hover:underline">{t("login.termsOfService")}</Link>
          {" "}{t("login.and")}{" "}
          <Link href="/privacy" className="text-gray-400 hover:underline">{t("login.privacyPolicy")}</Link>
        </p>
      </div>
    </div>
  );
}
