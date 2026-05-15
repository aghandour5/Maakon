import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const ADMIN_SUBDOMAIN = process.env.ADMIN_SUBDOMAIN?.trim() || "";
const EXPLICIT_ADMIN_ALLOWED_HOSTS = (process.env.ADMIN_ALLOWED_HOSTS || "")
  .split(",")
  .map(host => host.trim())
  .filter(Boolean);
const CORS_HOSTS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean)
  .map(origin => {
    try {
      return new URL(origin).host.toLowerCase();
    } catch {
      return origin.toLowerCase();
    }
  });
const ADMIN_ALLOWED_HOSTS = [
  ADMIN_SUBDOMAIN,
  process.env.RENDER_EXTERNAL_HOSTNAME,
  ...CORS_HOSTS,
  ...EXPLICIT_ADMIN_ALLOWED_HOSTS,
]
  .filter((host): host is string => !!host)
  .map(host => host.toLowerCase());
const ADMIN_HOST_CHECK_ENABLED = Boolean(ADMIN_SUBDOMAIN || EXPLICIT_ADMIN_ALLOWED_HOSTS.length > 0);
const ADMIN_IP_WHITELIST = (process.env.ADMIN_IP_WHITELIST || "")
  .split(",")
  .map(ip => ip.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production") {
  if (!ADMIN_HOST_CHECK_ENABLED) {
    throw new Error(
      "SECURITY ERROR: Missing ADMIN_SUBDOMAIN or ADMIN_ALLOWED_HOSTS in production. Admin subdomain check would fail open."
    );
  }
  if (ADMIN_IP_WHITELIST.length === 0) {
    throw new Error(
      "SECURITY ERROR: Missing ADMIN_IP_WHITELIST in production. Admin IP check would fail open."
    );
  }
}

function normalizeHost(host: string | undefined): string | null {
  if (!host) return null;
  return host.split(",", 1)[0].trim().toLowerCase();
}

function getRequestHosts(req: Request): string[] {
  return [
    req.hostname,
    req.get("host"),
    req.get("x-forwarded-host"),
    req.get("x-original-host"),
  ]
    .map(normalizeHost)
    .filter((host): host is string => !!host);
}

/**
 * Ensures that the request hostname matches a configured admin host.
 * Admin role and MFA are still enforced separately by the admin router.
 */
export const adminSubdomainCheck = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const requestHosts = getRequestHosts(req);
  const isAllowedHost = requestHosts.some(host => ADMIN_ALLOWED_HOSTS.includes(host));

  if (!isAllowedHost) {
    logger.warn(
      { ip: req.ip, hosts: requestHosts, allowedHosts: ADMIN_ALLOWED_HOSTS },
      "Blocked admin request from unauthorized host",
    );
    res.status(404).end(); // 404 instead of 403 to completely obscure the admin endpoint
    return;
  }

  next();
};

/**
 * Enforces IP restriction based on the ADMIN_IP_WHITELIST env var.
 */
export const adminIpWhitelist = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "production") {
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
