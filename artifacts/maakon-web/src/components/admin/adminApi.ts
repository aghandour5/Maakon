import { createContext, useContext } from "react";
import { withCsrfHeader } from "@/lib/csrf";

export type ErrorKind =
  | "auth"
  | "mfa"
  | "forbidden"
  | "rate_limited"
  | "server"
  | "network";
export class AdminApiError extends Error {
  constructor(
    readonly kind: ErrorKind,
    message: string,
    readonly status = 0,
  ) {
    super(message);
  }
}
export const isGateError = (e: unknown): e is AdminApiError =>
  e instanceof AdminApiError && ["auth", "mfa", "forbidden"].includes(e.kind);
export async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      ...options,
      headers: withCsrfHeader(options.method, {
        "Content-Type": "application/json",
        ...options.headers,
      }),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new AdminApiError("network", "Could not reach the server.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})),
      status = response.status;
    let kind: ErrorKind = "server";
    if (status === 401) kind = "auth";
    if (status === 403)
      kind = body.error === "MFA_REQUIRED" ? "mfa" : "forbidden";
    if (status === 429) kind = "rate_limited";
    throw new AdminApiError(
      kind,
      body.message || body.error || `Request failed (HTTP ${status})`,
      status,
    );
  }
  if (response.status === 204) return undefined as T;
  try {
    return await response.json();
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new AdminApiError(
      "server",
      "The server returned an unreadable response.",
      response.status,
    );
  }
}
export const AdminApiContext = createContext(adminFetch);
export const useAdminApi = () => useContext(AdminApiContext);
