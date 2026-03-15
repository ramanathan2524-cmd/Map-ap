import { Request, Response, NextFunction } from "express";
import { getCache, setCache } from "../config/redis";
import { logger } from "../utils/logger";

/**
 * Redis-backed HTTP cache middleware.
 * Cache key = full request URL (path + query string).
 * Falls back gracefully if Redis is unavailable.
 */
export const cacheMiddleware = (ttlSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ap-map:${req.originalUrl}`;

    try {
      const cached = await getCache(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json");
        return res.send(cached);
      }
    } catch (e) {
      logger.debug("Cache read failed, proceeding without cache");
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      setCache(key, JSON.stringify(body), ttlSeconds).catch(() => {});
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
};
