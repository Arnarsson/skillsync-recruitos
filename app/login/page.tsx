"use client";

import { signIn } from "next-auth/react";
import { Github, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

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
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-400">
            Sign in to continue finding elite engineers
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
            Prøv Demo / Try Demo
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1b1e] px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* GitHub Login */}
          <Button
            size="lg"
            onClick={handleGitHubLogin}
            className="w-full bg-white dark:bg-white text-[#141517] hover:bg-gray-200 dark:hover:bg-gray-200 border-transparent"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </Button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-white hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          By signing in, you agree to our{" "}
          <a href="#" className="text-gray-400 hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-gray-400 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
