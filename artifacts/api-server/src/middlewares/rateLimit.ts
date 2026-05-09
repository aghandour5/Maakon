import type { RequestHandler } from "express";
import { rateLimit as expressRateLimit } from "express-rate-limit";
import { logger } from "../lib/logger";

export function rateLimit(
  windowMs: number,
  maxRequests: number,
  message: string,
): RequestHandler {
  return expressRateLimit({
    windowMs,
    limit: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    handler: (req, res, _next, options) => {
      logger.warn(
        { ip: req.ip, path: req.originalUrl },
        "Rate limit exceeded",
      );
      res.status(options.statusCode).json(options.message);
    },
  });
}
