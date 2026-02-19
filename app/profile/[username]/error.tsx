"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Profile] Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Profile unavailable</h1>
        <p className="text-muted-foreground mb-6">
          This candidate profile couldn&apos;t be loaded. They may not have a public GitHub profile.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">Try again</Button>
          <Button asChild>
            <Link href="/pipeline">Back to Pipeline</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
