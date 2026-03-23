import type { Request, Response, NextFunction } from "express";
import {
  validateSession,
  SESSION_COOKIE_NAME,
  getSessionClearCookieOptions,
} from "../lib/session";
import type { User } from "@workspace/db/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
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
    const user = await validateSession(token);
    if (!user) {
      // Clear invalid cookie
      res.clearCookie(SESSION_COOKIE_NAME, getSessionClearCookieOptions());
      res.status(401).json({ error: "Session invalid or expired" });
      return;
    }

    req.user = user;
    req.sessionId = token;
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
    const user = await validateSession(token);
    if (user) {
      req.user = user;
      req.sessionId = token;
    } else {
      res.clearCookie(SESSION_COOKIE_NAME, getSessionClearCookieOptions());
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
