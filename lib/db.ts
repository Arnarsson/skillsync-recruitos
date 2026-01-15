import { PrismaClient } from "@prisma/client";

// Database is optional - only use if DATABASE_URL is configured
const isDatabaseConfigured = !!process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only create Prisma client if database is configured
export const prisma = isDatabaseConfigured
  ? globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
  : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
