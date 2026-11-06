import { PrismaClient } from "@prisma/client";

// Vercel's Supabase integration provides POSTGRES_PRISMA_URL.
// Prefer an explicitly configured DATABASE_URL, then reuse the existing
// encrypted integration variable without reading/copying its secret value.
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
