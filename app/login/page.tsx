"use client";

import { signIn } from "next-auth/react";
import { Github, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  // Pick up NextAuth error from URL (e.g., OAuth failure)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      const errorMessages: Record<string, string> = {
        OAuthSignin: "Kunne ikke starte GitHub login. Prøv igen.",
        OAuthCallback: "GitHub login fejlede. Prøv igen.",
        OAuthCreateAccount: "Kunne ikke oprette konto via GitHub.",
        OAuthAccountNotLinked:
          "Denne email er allerede tilknyttet en anden login-metode.",
        Callback: "Login fejlede. Prøv igen.",
        CredentialsSignin: "Ugyldig email eller adgangskode.",
        SessionRequired: "Du skal logge ind for at se denne side.",
        Default: "Der opstod en fejl. Prøv igen.",
      };
      setError(errorMessages[urlError] || errorMessages.Default);
    }
  }, [searchParams]);

  const callbackUrl = searchParams.get("callbackUrl") || "/search";

  const handleGitHubLogin = () => {
    setGithubLoading(true);
    setError(null);
    signIn("github", { callbackUrl });
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Indtast venligst din email");
      return;
    }
    if (!password) {
      setError("Indtast venligst din adgangskode");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin"
          ? "Ugyldig email eller adgangskode"
          : result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Noget gik galt. Prøv igen.");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold mb-2">Velkommen tilbage</h1>
          <p className="text-gray-400">
            Log ind for at fortsætte med at finde elite ingeniører
          </p>
        </div>

        <div className="bg-[#1a1b1e] rounded-2xl border border-white/10 p-8">
          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleGitHubLogin}
            disabled={githubLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#141517] rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {githubLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Github className="w-5 h-5" />
            )}
            Fortsæt med GitHub
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1a1b1e] text-gray-500">eller</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dig@eksempel.dk"
                autoComplete="email"
                disabled={loading || githubLoading}
                className="w-full px-4 py-3 bg-[#141517] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Adgangskode
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Indtast din adgangskode"
                autoComplete="current-password"
                disabled={loading || githubLoading}
                className="w-full px-4 py-3 bg-[#141517] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || githubLoading}
              className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logger ind...
                </>
              ) : (
                "Log Ind"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Har du ikke en konto?{" "}
            <Link href="/signup" className="text-white hover:underline">
              Opret konto
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
