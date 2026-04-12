import type {
  FirebaseLoginBodyParams,
  CompleteProfileBodyParams,
  CompleteNgoProfileBodyParams,
  CreateDraftPostBodyParams,
} from "@workspace/api-zod";
import { withCsrfHeader } from "./csrf";

// Isolated fetch calls for auth — always include credentials for cookies.

const baseHeaders = {
  "Content-Type": "application/json",
};

function buildHeaders(options?: RequestInit): Headers {
  return withCsrfHeader(options?.method, {
    ...baseHeaders,
    ...(options?.headers ?? {}),
  });
}

async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(path, {
    ...options,
    headers: buildHeaders(options),
  });
}

/** Exchange a Supabase ID token for a server session */
export async function supabaseLogin(body: FirebaseLoginBodyParams) {
  const res = await apiRequest("/api/auth/supabase-login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data; // Could return { status: 'success' | 'mfa_setup_required' | 'mfa_challenge', user: ... }
}

export async function setupMfa() {
  const res = await apiRequest("/api/auth/mfa-setup", {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to setup MFA");
  return data as { qrCodeDataUrl: string };
}

export async function verifyMfa(code: string) {
  const res = await apiRequest("/api/auth/mfa-verify", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to verify MFA");
  return data;
}

export async function challengeMfa(code: string) {
  const res = await apiRequest("/api/auth/mfa-challenge", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to verify MFA code");
  return data;
}

/** Create a draft post (no auth required) */
export async function createDraftPost(body: CreateDraftPostBodyParams) {
  const res = await apiRequest("/api/posts/draft", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create draft post");
  return data as { draftToken: string; postId: number };
}

export async function completeProfile(body: CompleteProfileBodyParams) {
  const res = await apiRequest("/api/auth/complete-profile", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to complete profile");
  return data;
}

export async function completeNgoProfile(body: CompleteNgoProfileBodyParams) {
  const res = await apiRequest("/api/auth/complete-ngo-profile", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to complete NGO profile");
  return data;
}

export async function logout() {
  const res = await apiRequest("/api/auth/logout", {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to logout");
  return data;
}

export async function fetchCurrentUser() {
  const res = await apiRequest("/api/auth/me", {
    method: "GET",
  });
  if (res.status === 401) {
    return null;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch user");
  return data.user;
}
