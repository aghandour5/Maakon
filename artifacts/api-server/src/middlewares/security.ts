import type { NextFunction, Request, Response } from "express";

/**
 * Lightweight middleware to add essential security headers to all responses.
 * Implements defense-in-depth without requiring external dependencies.
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Prevent clickjacking by forbidding rendering in iframes.
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME sniffing.
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Advertise HSTS for clients already using HTTPS.
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=15552000; includeSubDomains",
  );

  // Disable browser DNS prefetching.
  res.setHeader("X-DNS-Prefetch-Control", "off");

  // Do not send referrer details to other origins.
  res.setHeader("Referrer-Policy", "no-referrer");

  // Prevent IE from executing downloads in the site context.
  res.setHeader("X-Download-Options", "noopen");

  // Disable the legacy XSS auditor to avoid inconsistent browser behavior.
  res.setHeader("X-XSS-Protection", "0");

  next();
};
