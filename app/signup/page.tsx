"use client";

import { signIn } from "next-auth/react";
import { Github, Check, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleGitHubSignup = () => {
    setGithubLoading(true);
    setError(null);
    signIn("github", { callbackUrl: "/search" });
  };

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (!email.trim()) {
      setError("Indtast venligst din email");
      return;
    }
    if (!email.includes("@")) {
      setError("Indtast venligst en gyldig email-adresse");
      return;
    }
    if (!password) {
      setError("Indtast venligst en adgangskode");
      return;
    }
    if (password.length < 8) {
      setError("Adgangskode skal være mindst 8 tegn");
      return;
    }

    setLoading(true);

    try {
      // Create account
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.error || "Kunne ikke oprette konto. Prøv igen.");
        setLoading(false);
        return;
      }

      // Auto-login after signup
      const loginResult = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        // Account created but auto-login failed — redirect to login
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      } else if (loginResult?.ok) {
        router.push("/search");
        router.refresh();
      }
    } catch {
      setError("Noget gik galt. Prøv igen senere.");
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
          <h1 className="text-3xl font-bold mb-2">Opret din konto</h1>
          <p className="text-gray-400">
            Begynd at finde elite ingeniører på få minutter
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

          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">
                Konto oprettet! Du omdirigeres til login...
              </p>
            </div>
          )}

          <button
            onClick={handleGitHubSignup}
            disabled={githubLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#141517] rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {githubLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Github className="w-5 h-5" />
            )}
            Tilmeld med GitHub
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1a1b1e] text-gray-500">
                eller fortsæt med email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Fulde navn
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jens Jensen"
                autoComplete="name"
                disabled={loading || githubLoading}
                className="w-full px-4 py-3 bg-[#141517] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Arbejds-email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dig@virksomhed.dk"
                autoComplete="email"
                required
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
                placeholder="Mindst 8 tegn"
                autoComplete="new-password"
                required
                minLength={8}
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
                  Opretter konto...
                </>
              ) : (
                "Opret Konto"
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Gratis prøveperiode med 5 dybdeprofil kreditter</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Intet kreditkort krævet</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Annuller når som helst</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Har du allerede en konto?{" "}
            <Link href="/login" className="text-white hover:underline">
              Log ind
            </Link>
          </p>

          <p className="text-center text-xs text-gray-600 mt-4">
            Ved at tilmelde dig accepterer du vores{" "}
            <a href="/terms" className="text-gray-400 hover:underline">
              Servicevilkår
            </a>{" "}
            og{" "}
            <a href="/privacy" className="text-gray-400 hover:underline">
              Privatlivspolitik
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
