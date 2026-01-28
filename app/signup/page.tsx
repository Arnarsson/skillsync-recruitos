"use client";

import { signIn } from "next-auth/react";
import { Github, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const handleGitHubSignup = () => {
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
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-400">
            Start finding elite engineers in minutes
          </p>
        </div>

        <div className="bg-[#1a1b1e] rounded-2xl border border-white/10 p-8">
          <Button
            size="lg"
            variant="outline"
            onClick={handleGitHubSignup}
            className="w-full bg-white text-[#141517] hover:bg-gray-200 border-transparent"
          >
            <Github className="w-5 h-5" />
            Sign up with GitHub
          </Button>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Start free - 3 AI profile analyses included</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Cancel anytime</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          By signing up, you agree to our{" "}
          <a href="#" className="text-gray-400 hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-gray-400 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
