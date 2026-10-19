import { PrismaClient } from "@prisma/client";

// Reuse a single client in development: Next.js hot reload would otherwise
// open a new database connection pool on every change.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
