import type {
  FirebaseLoginBodyParams,
  CompleteProfileBodyParams,
  CompleteNgoProfileBodyParams,
  SendWhatsAppOtpBodyParams,
  VerifyWhatsAppOtpBodyParams,
  CreateDraftPostBodyParams,
} from "@workspace/api-zod";

// Isolated fetch calls for auth — always include credentials for cookies.

const baseHeaders = {
  "Content-Type": "application/json",
};

/** Exchange a Supabase ID token for a server session */
export async function supabaseLogin(body: FirebaseLoginBodyParams) {
  const res = await fetch("/api/auth/supabase-login", {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data; // Could return { status: 'success' | 'mfa_setup_required' | 'mfa_challenge', user: ... }
}

export async function setupMfa() {
  const res = await fetch("/api/auth/mfa-setup", {
    method: "GET",
    headers: baseHeaders,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to setup MFA");
  return data as { qrCodeDataUrl: string };
}

export async function verifyMfa(code: string) {
  const res = await fetch("/api/auth/mfa-verify", {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to verify MFA");
  return data;
}

export async function challengeMfa(code: string) {
  const res = await fetch("/api/auth/mfa-challenge", {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to verify MFA code");
  return data;
}

/** Create a draft post (no auth required) */
export async function createDraftPost(body: CreateDraftPostBodyParams) {
  const res = await fetch("/api/posts/draft", {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create draft post");
  return data as { draftToken: string; postId: number };
}

/** Send WhatsApp OTP for NGO verification */
export async function sendWhatsAppOtp(body: SendWhatsAppOtpBodyParams) {
  const res = await fetch("/api/auth/send-whatsapp-otp", {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send WhatsApp OTP");
  return data;
}

/** Verify WhatsApp OTP for NGO verification */
export async function verifyWhatsAppOtp(body: VerifyWhatsAppOtpBodyParams) {
  const res = await fetch("/api/auth/verify-whatsapp-otp", {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to verify WhatsApp OTP");
  return data;
}

export async function completeProfile(body: CompleteProfileBodyParams) {
  const res = await fetch("/api/auth/complete-profile", {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to complete profile");
  return data;
}

export async function completeNgoProfile(body: CompleteNgoProfileBodyParams) {
  const res = await fetch("/api/auth/complete-ngo-profile", {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to complete NGO profile");
  return data;
}

export async function logout() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    headers: baseHeaders,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to logout");
  return data;
}

export async function fetchCurrentUser() {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    headers: baseHeaders,
  });
  if (res.status === 401) {
    return null;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch user");
  return data.user;
}
