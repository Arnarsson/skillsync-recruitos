"use client";

import { signIn } from "next-auth/react";
import { Github, Check } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const handleGitHubSignup = () => {
    signIn("github", { callbackUrl: "/search" });
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
          <button
            onClick={handleGitHubSignup}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#141517] rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <Github className="w-5 h-5" />
            Sign up with GitHub
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1a1b1e] text-gray-500">or continue with email</span>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-[#141517] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Work Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-[#141517] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Create a strong password"
                className="w-full px-4 py-3 bg-[#141517] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Create Account
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Free trial with 5 deep profile credits</span>
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

          <p className="text-center text-xs text-gray-600 mt-4">
            By signing up, you agree to our{" "}
            <a href="#" className="text-gray-400 hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-gray-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
