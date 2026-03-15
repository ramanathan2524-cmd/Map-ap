import { createClient } from "redis";
import { logger } from "../utils/logger";

export const redisClient = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 5) return false;
      return retries * 500;
    },
  },
});

redisClient.on("error", (err) => {
  // Only log once, don't flood logs
  if (err.code !== "ECONNREFUSED") {
    logger.warn("Redis error:", err.message);
  }
});

export const getCache = async (key: string): Promise<string | null> => {
  try {
    if (!redisClient.isOpen) return null;
    return await redisClient.get(key);
  } catch {
    return null;
  }
};

export const setCache = async (
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(key, ttlSeconds, value);
  } catch {
    // silently fail — caching is optional
  }
};

export const deleteCache = async (pattern: string): Promise<void> => {
  try {
    if (!redisClient.isOpen) return;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(keys);
  } catch {}
};
