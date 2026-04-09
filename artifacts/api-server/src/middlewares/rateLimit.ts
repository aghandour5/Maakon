import type { NextFunction, Request, RequestHandler, Response } from "express";
import { logger } from "../lib/logger";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export function rateLimit(
  windowMs: number,
  maxRequests: number,
  message: string,
): RequestHandler {
  const store = new Map<string, RateLimitEntry>();
  let requestsSinceCleanup = 0;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();

    // Periodic lazy cleanup keeps the in-memory store bounded without timers.
    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= 100) {
      requestsSinceCleanup = 0;
      for (const [key, entry] of store) {
        if (entry.resetAt <= now) {
          store.delete(key);
        }
      }
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const existingEntry = store.get(ip);

    if (!existingEntry || existingEntry.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existingEntry.count >= maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existingEntry.resetAt - now) / 1000),
      );

      res.setHeader("Retry-After", String(retryAfterSeconds));
      logger.warn({ ip, path: req.originalUrl }, "Rate limit exceeded");
      res.status(429).json({ error: message });
      return;
    }

    existingEntry.count += 1;
    store.set(ip, existingEntry);
    next();
  };
}
