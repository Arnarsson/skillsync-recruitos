import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Return a dummy client that will fail gracefully at runtime
    // This allows the build to succeed even without DATABASE_URL
    console.warn("DATABASE_URL not set — Prisma client will fail on queries");
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === "$connect" || prop === "$disconnect") {
          return () => Promise.resolve();
        }
        if (prop === "$transaction") {
          return () => Promise.reject(new Error("Database not configured"));
        }
        // Return a chainable proxy for model access
        return new Proxy(
          {},
          {
            get() {
              return () => Promise.reject(new Error("Database not configured"));
            },
          },
        );
      },
    });
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Prevent multiple instances during hot-reload in development
const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export { prisma };
export default prisma;
