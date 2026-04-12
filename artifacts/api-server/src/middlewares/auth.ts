import type { Request, Response, NextFunction } from "express";
import {
  validateSession,
  SESSION_COOKIE_NAME,
  getSessionClearCookieOptions,
} from "../lib/session";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  createCsrfToken,
  getCsrfCookieOptions,
  getCsrfClearCookieOptions,
  isCsrfProtectedMethod,
  isValidCsrfToken,
  safeCompareCsrfTokens,
} from "../lib/csrf";
import type { User } from "@workspace/db/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
      mfaVerified?: boolean;
      csrfToken?: string;
    }
  }
}

/**
 * Middleware that strictly requires an authenticated session.
 * Rejects requests with 401 Unauthorized if missing, invalid, or expired.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const result = await validateSession(token);
    if (!result) {
      // Clear invalid cookie
      res.clearCookie(SESSION_COOKIE_NAME, getSessionClearCookieOptions());
      res.clearCookie(CSRF_COOKIE_NAME, getCsrfClearCookieOptions());
      res.status(401).json({ error: "Session invalid or expired" });
      return;
    }

    const cookieCsrfToken = req.cookies?.[CSRF_COOKIE_NAME];
    const csrfToken = isValidCsrfToken(cookieCsrfToken)
      ? cookieCsrfToken
      : createCsrfToken();

    if (cookieCsrfToken !== csrfToken) {
      res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());
    }

    if (isCsrfProtectedMethod(req.method)) {
      const csrfHeaderValue = req.header(CSRF_HEADER_NAME);
      if (
        !isValidCsrfToken(csrfHeaderValue) ||
        !safeCompareCsrfTokens(csrfToken, csrfHeaderValue)
      ) {
        res.status(403).json({ error: "CSRF token missing or invalid" });
        return;
      }
    }

    req.user = result.user;
    req.sessionId = token;
    req.mfaVerified = result.mfaVerified;
    req.csrfToken = csrfToken;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware that optionally attaches the user to the request if a valid session exists.
 * Does NOT block unauthenticated requests. Safe for public endpoints that have progressive enhancement for logged-in users.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    next();
    return;
  }

  try {
    const result = await validateSession(token);
    if (result) {
      req.user = result.user;
      req.sessionId = token;
      req.mfaVerified = result.mfaVerified;

      const cookieCsrfToken = req.cookies?.[CSRF_COOKIE_NAME];
      if (!isValidCsrfToken(cookieCsrfToken)) {
        res.cookie(CSRF_COOKIE_NAME, createCsrfToken(), getCsrfCookieOptions());
      }
    } else {
      res.clearCookie(SESSION_COOKIE_NAME, getSessionClearCookieOptions());
      res.clearCookie(CSRF_COOKIE_NAME, getCsrfClearCookieOptions());
    }
    next();
  } catch (error) {
    // If validation fails unexpectedly, we just don't attach the user
    next();
  }
};

/**
 * Middleware that strictly requires the user to have the 'admin' role.
 * Must be used AFTER requireAuth.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

/**
 * Middleware that requires admins to have completed an MFA challenge.
 * Must be used AFTER requireAuth and requireAdmin.
 */
export const requireMfa = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === "admin" && !req.mfaVerified) {
    res.status(403).json({ 
      error: "MFA_REQUIRED",
      message: "This area requires an additional security check (MFA)."
    });
    return;
  }
  next();
};
