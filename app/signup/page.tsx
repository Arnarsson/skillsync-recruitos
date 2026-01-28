"use client";

import { signIn } from "next-auth/react";
import { Github, Check } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function SignupPage() {
  const { t } = useLanguage();

  const handleGitHubSignup = () => {
    signIn("github", { callbackUrl: "/intake" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#141517] font-bold text-xl">R</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t("auth.signup.title")}</h1>
          <p className="text-gray-400">
            {t("auth.signup.subtitle")}
          </p>
        </div>

        <div className="bg-[#1a1b1e] rounded-2xl border border-white/10 p-8">
          <button
            onClick={handleGitHubSignup}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#141517] rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <Github className="w-5 h-5" />
            {t("auth.signup.githubButton")}
          </button>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>{t("auth.signup.benefits.freeCredits")}</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>{t("auth.signup.benefits.noCard")}</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>{t("auth.signup.benefits.cancelAnytime")}</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t("auth.signup.hasAccount")}{" "}
            <Link href="/login" className="text-white hover:underline">
              {t("auth.signup.signInLink")}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          {t("auth.termsNotice")}{" "}
          <Link href="/terms" className="text-gray-400 hover:underline">{t("footer.terms")}</Link>
          {" "}{t("common.and")}{" "}
          <Link href="/privacy" className="text-gray-400 hover:underline">{t("footer.privacy")}</Link>
        </p>
      </div>
    </div>
  );
}
