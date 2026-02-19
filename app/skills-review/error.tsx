"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SkillsReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SkillsReview] Error:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-3">Skills configuration error</h1>
        <p className="text-muted-foreground mb-2 text-sm font-mono bg-muted px-3 py-2 rounded">
          {error.message || "Unexpected error"}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">Try again</Button>
          <Button asChild>
            <Link href="/intake">Back to Intake</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
