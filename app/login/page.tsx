"use client";

import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const handleGitHubLogin = () => {
    signIn("github", { callbackUrl: "/intake" });
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

        <div className="bg-[#1a1b1e] rounded-2xl border border-white/10 p-8">
          <button
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#141517] rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

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
