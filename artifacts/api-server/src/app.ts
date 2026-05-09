import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { securityHeaders } from "./middlewares/security";
import { rateLimit } from "./middlewares/rateLimit";

const configuredCorsOrigins = (process.env["CORS_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, "").toLowerCase())
  .filter(Boolean);

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "").toLowerCase();
}

function isAllowedOrigin(req: Request, origin: string): boolean {
  const normalizedOrigin = normalizeOrigin(origin);

  if (configuredCorsOrigins.includes(normalizedOrigin)) {
    return true;
  }

  if (configuredCorsOrigins.length > 0) {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const host = req.header("host")?.trim();

  if (!host) {
    return false;
  }

  return normalizedOrigin === normalizeOrigin(`${req.protocol}://${host}`);
}

const app: Express = express();
const jsonBodyLimit = process.env["JSON_BODY_LIMIT"] ?? "100kb";
const urlencodedBodyLimit = process.env["URLENCODED_BODY_LIMIT"] ?? "100kb";
const apiReadRateLimiter = rateLimit(
  60 * 1000,
  300,
  "Too many read requests from this IP, please try again shortly.",
);

// SECURITY: Ensure accurate client IP identification for rate limiting and audit logging.
// The API server is behind a reverse proxy/load balancer in production.
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(securityHeaders);

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.method === "OPTIONS",
    },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors((req, callback) => {
    const origin = req.header("Origin");

    if (!origin) {
      callback(null, { origin: false, credentials: true });
      return;
    }

    callback(null, {
      origin: isAllowedOrigin(req, origin),
      credentials: true,
    });
  }),
);
app.use(express.json({ limit: jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: urlencodedBodyLimit, parameterLimit: 1000 }));
app.use(cookieParser());

app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "GET") {
    next();
    return;
  }

  apiReadRateLimiter(req, res, next);
});

app.use("/api", router);

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const isObject = typeof err === "object" && err !== null;
  const statusValue = isObject && "status" in err ? err.status : undefined;
  const typeValue = isObject && "type" in err ? err.type : undefined;
  const status = typeof statusValue === "number" ? statusValue : undefined;
  const type = typeof typeValue === "string" ? typeValue : undefined;
  const isJsonParseError =
    err instanceof SyntaxError &&
    status === 400 &&
    isObject &&
    "body" in err;
  const isPayloadTooLarge = status === 413 || type === "entity.too.large";

  if (isPayloadTooLarge) {
    res.status(413).json({ error: "Request body too large" });
    return;
  }

  if (isJsonParseError) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  logger.error(
    { err, method: req.method, url: req.originalUrl },
    "Unhandled request error",
  );
  res.status(500).json({ error: "Internal server error" });
});

export default app;
