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

  const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req.header("host");

  if (!host) {
    return false;
  }

  const protocol = forwardedProto || req.protocol;
  return normalizedOrigin === normalizeOrigin(`${protocol}://${host}`);
}

const app: Express = express();

app.disable("x-powered-by");

app.use(securityHeaders);

app.use(
  pinoHttp({
    logger,
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", router);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const parseError = err as SyntaxError & {
    status?: number;
    body?: unknown;
  };
  const isJsonParseError =
    err instanceof SyntaxError &&
    parseError.status === 400 &&
    "body" in parseError;

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
