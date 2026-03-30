import { Request, Response, NextFunction } from "express";

export const rateLimit = (
  windowMs: number,
  max: number,
  message: string = "Too many requests, please try again later."
) => {
  const store = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    // Basic cleanup to prevent memory leaks
    if (Math.random() < 0.05) {
      for (const [k, v] of store.entries()) {
        if (v.resetTime < now) store.delete(k);
      }
    }

    let record = store.get(key);
    if (!record || record.resetTime < now) {
      record = { count: 1, resetTime: now + windowMs };
      store.set(key, record);
    } else {
      record.count++;
      if (record.count > max) {
        res.status(429).json({ error: message });
        return;
      }
    }
    next();
  };
};
