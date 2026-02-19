import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const checks = {
    status: "ok" as "ok" | "degraded",
    database: false,
    github_token: "missing" as "ok" | "missing",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "unknown",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.status = "degraded";
  }

  if (process.env.GITHUB_TOKEN) {
    checks.github_token = "ok";
  } else {
    checks.status = "degraded";
  }

  const allHealthy = checks.database && checks.github_token === "ok";
  const statusCode = allHealthy ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}
