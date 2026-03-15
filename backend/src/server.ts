import "dotenv/config";
import app from "./app";
import { logger } from "./utils/logger";
import { prisma } from "./config/database";
import { redisClient } from "./config/redis";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

const start = async () => {
  try {
    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    logger.info("✅ PostgreSQL connected");

    // Connect to Redis (optional — graceful fallback)
    try {
      await redisClient.connect();
      logger.info("✅ Redis connected");
    } catch {
      logger.warn("⚠️  Redis unavailable — caching disabled");
    }

    app.listen(PORT, () => {
      logger.info(`🚀 AP Election Map API running on http://localhost:${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    logger.error("❌ Server startup failed", err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully…`);
  await prisma.$disconnect();
  try { await redisClient.disconnect(); } catch {}
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

start();
