import { PrismaClient } from "@prisma/client";

// Supabase integrations on Vercel provision POSTGRES_PRISMA_URL.
// Preserve DATABASE_URL as the explicit override for standalone deployments.
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
