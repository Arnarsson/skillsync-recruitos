"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileIndexPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No candidate selected</h2>
        <p className="text-muted-foreground mb-6">
          Select a candidate from the pipeline to view their profile.
        </p>
        <Link href="/pipeline">
          <Button className="gap-2">
            Go to Pipeline
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
