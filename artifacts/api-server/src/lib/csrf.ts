import crypto from "node:crypto";
import type { CookieOptions } from "express";
import { SESSION_MAX_AGE_DAYS } from "./session";

export const CSRF_COOKIE_NAME = "maakon_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_TOKEN_BYTES = 32;
const CSRF_TOKEN_HEX_LENGTH = CSRF_TOKEN_BYTES * 2;
const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function buildCsrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function getCsrfCookieOptions(
  overrides: CookieOptions = {},
): CookieOptions {
  return {
    ...buildCsrfCookieOptions(),
    ...overrides,
  };
}

export function getCsrfClearCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...options } = buildCsrfCookieOptions();
  return options;
}

export function createCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_BYTES).toString("hex");
}

export function isCsrfProtectedMethod(method: string): boolean {
  return CSRF_PROTECTED_METHODS.has(method.toUpperCase());
}

export function isValidCsrfToken(token: unknown): token is string {
  return (
    typeof token === "string" &&
    token.length === CSRF_TOKEN_HEX_LENGTH &&
    /^[a-f0-9]+$/i.test(token)
  );
}

export function safeCompareCsrfTokens(
  expectedToken: string,
  actualToken: string,
): boolean {
  if (!isValidCsrfToken(expectedToken) || !isValidCsrfToken(actualToken)) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedToken, "utf8"),
    Buffer.from(actualToken, "utf8"),
  );
}
