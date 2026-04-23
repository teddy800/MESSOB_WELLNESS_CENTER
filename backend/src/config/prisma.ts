import { PrismaClient } from "../generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

// Singleton Prisma Client for PostgreSQL
// Note: Prisma 7 requires an adapter when using the new client architecture

const globalForPrisma = global as unknown as { prisma: PrismaClient; pool: Pool };

// Create PostgreSQL connection pool with explicit configuration
const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString: env.DATABASE_URL,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  await pool.end();
});

export default prisma;
