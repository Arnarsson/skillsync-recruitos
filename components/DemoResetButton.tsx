"use client";

import { useState } from "react";
import { RotateCcw, Check, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Demo Reset Button
 * 
 * Provides a one-click demo environment reset:
 * - Clears localStorage
 * - Resets session
 * - Reloads sample data
 * - Redirects to demo login
 * 
 * Only visible in demo mode or development
 */
export function DemoResetButton() {
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleReset = async () => {
    if (!confirm("Reset demo environment? This will clear all demo data and reload sample data.")) {
      return;
    }

    setIsResetting(true);
    setStatus("idle");

    try {
      // 1. Clear localStorage
      localStorage.clear();
      console.log("✅ Cleared localStorage");

      // 2. Clear sessionStorage
      sessionStorage.clear();
      console.log("✅ Cleared sessionStorage");

      // 3. Call API to reset demo data (if endpoint exists)
      try {
        const response = await fetch("/api/demo/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        
        if (response.ok) {
          console.log("✅ Server-side demo data reset");
        }
      } catch (err) {
        console.log("⚠️  Server reset endpoint not available (optional)");
      }

      // 4. Set demo mode flag
      localStorage.setItem("recruitos_demo_mode", "true");

      // 5. Show success
      setStatus("success");
      console.log("✅ Demo reset complete");

      // 6. Redirect after brief delay
      setTimeout(() => {
        window.location.href = "/?demo=true";
      }, 1500);

    } catch (error) {
      console.error("❌ Demo reset failed:", error);
      setStatus("error");
      setIsResetting(false);
    }
  };

  // Only show in development or demo mode
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_DEMO_MODE) {
    return null;
  }

  return (
    <Button
      onClick={handleReset}
      disabled={isResetting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {status === "idle" && (
        <>
          <RotateCcw className={`w-4 h-4 ${isResetting ? "animate-spin" : ""}`} />
          {isResetting ? "Resetting..." : "Reset Demo"}
        </>
      )}
      {status === "success" && (
        <>
          <Check className="w-4 h-4 text-green-600" />
          Demo Reset! Redirecting...
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="w-4 h-4 text-red-600" />
          Reset Failed
        </>
      )}
    </Button>
  );
}
