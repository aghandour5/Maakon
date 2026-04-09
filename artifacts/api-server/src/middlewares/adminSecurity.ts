import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const ADMIN_SUBDOMAIN = process.env.ADMIN_SUBDOMAIN || "admin.maakon.com";
const ADMIN_IP_WHITELIST = (process.env.ADMIN_IP_WHITELIST || "")
  .split(",")
  .map(ip => ip.trim())
  .filter(Boolean);

/**
 * Ensures that the request hostname matches the required admin subdomain.
 * Bypassed in local development unless specifically targeting it.
 */
export const adminSubdomainCheck = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "production") {
    return next(); // Bypass for local dev where hostname is usually localhost
  }

  // Allow passing if the hostname exactly string matches the configured subdomain
  // You might want to handle edge cases like proxy forwarded hosts here,
  // but if the reverse proxy normalizes req.hostname, this is sufficient.
  if (req.hostname !== ADMIN_SUBDOMAIN) {
    logger.warn({ ip: req.ip, hostname: req.hostname }, "Blocked admin request from unauthorized subdomain");
    res.status(404).end(); // 404 instead of 403 to completely obscure the admin endpoint
    return;
  }

  next();
};

/**
 * Enforces IP restriction based on the ADMIN_IP_WHITELIST env var.
 */
export const adminIpWhitelist = (req: Request, res: Response, next: NextFunction) => {
  // If no whitelist is defined, we allow-all (fail-open) to prevent locking admins out
  // during initial rollout. In a strict setup, you might want to fail-closed.
  if (ADMIN_IP_WHITELIST.length === 0) {
    return next();
  }

  const clientIp = req.ip || req.socket.remoteAddress || "";

  if (!ADMIN_IP_WHITELIST.includes(clientIp)) {
    logger.warn({ ip: clientIp, path: req.originalUrl }, "Blocked admin request from unauthorized IP");
    res.status(403).json({ error: "Access denied from this IP" });
    return;
  }

  next();
};
