import type { Request, Response, NextFunction } from "express";

/**
 * Lightweight middleware to add essential security headers to all responses.
 * Implements defense-in-depth without requiring external dependencies like Helmet.
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking by forbidding rendering in iframes
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Force HTTPS (HSTS) - 6 months max-age
  res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");

  // Disable browser DNS prefetching
  res.setHeader("X-DNS-Prefetch-Control", "off");

  // Control referrer information sent with requests
  res.setHeader("Referrer-Policy", "no-referrer");

  // Explicitly disable IE8 download execution
  res.setHeader("X-Download-Options", "noopen");

  // Enable XSS protection for older browsers
  res.setHeader("X-XSS-Protection", "0");

  next();
};
