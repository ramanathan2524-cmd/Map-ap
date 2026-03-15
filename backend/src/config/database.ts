import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

prisma.$on("query" as never, (e: any) => {
  if (process.env.LOG_QUERIES === "true") {
    logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
  }
});

prisma.$on("error" as never, (e: any) => {
  logger.error("Prisma error:", e);
});
