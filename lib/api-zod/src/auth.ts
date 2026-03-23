import { z } from "zod";

// ── Firebase Email Link auth ──────────────────────────────────────────────────

export const FirebaseLoginBody = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),
  accountType: z.enum(["individual", "ngo"]).optional(),
  /** Optional draft token to claim a post after email-link sign-in */
  draftToken: z.string().optional(),
});
export type FirebaseLoginBodyParams = z.infer<typeof FirebaseLoginBody>;

// ── WhatsApp OTP (NGO verification only) ──────────────────────────────────────

const phoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format. Must include country code (e.g. +961...)");

export const SendWhatsAppOtpBody = z.object({
  phone: phoneSchema,
});
export type SendWhatsAppOtpBodyParams = z.infer<typeof SendWhatsAppOtpBody>;

export const VerifyWhatsAppOtpBody = z.object({
  phone: phoneSchema,
  code: z.string().min(4, "OTP must be at least 4 digits").max(8, "OTP must be at most 8 digits"),
});
export type VerifyWhatsAppOtpBodyParams = z.infer<typeof VerifyWhatsAppOtpBody>;

// ── Profile completion ────────────────────────────────────────────────────────

export const CompleteProfileBody = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
});
export type CompleteProfileBodyParams = z.infer<typeof CompleteProfileBody>;

export const CompleteNgoProfileBody = z.object({
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
  governorate: z.string().min(1, "Governorate is required"),
  phone: phoneSchema.optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
export type CompleteNgoProfileBodyParams = z.infer<typeof CompleteNgoProfileBody>;

// ── Draft post creation (unauthenticated) ─────────────────────────────────────

export const CreateDraftPostBody = z.object({
  postType: z.enum(["need", "offer"]),
  title: z.string().min(3),
  category: z.string().min(1),
  description: z.string().min(10),
  urgency: z.enum(["critical", "high", "medium", "low"]).optional(),
  governorate: z.string().min(1),
  district: z.string().optional(),
  exactAddressPrivate: z.string().optional(),
  providerType: z.string().optional(),
  contactMethod: z.string().optional(),
  contactInfo: z.string().optional(),
  expiresInDays: z.number().int().min(1).max(90).optional(),
  providedLat: z.number().optional(),
  providedLng: z.number().optional(),
});
export type CreateDraftPostBodyParams = z.infer<typeof CreateDraftPostBody>;

// ── Legacy exports kept for backward compat ──

/** @deprecated Use FirebaseLoginBody instead */
export const RequestOtpBody = z.object({
  phone: phoneSchema,
});
export type RequestOtpBodyParams = z.infer<typeof RequestOtpBody>;

/** @deprecated Use FirebaseLoginBody instead */
export const VerifyOtpBody = z.object({
  phone: phoneSchema,
  code: z.string().length(6, "OTP must be 6 digits"),
  accountType: z.enum(["individual", "ngo"]).optional(),
});
export type VerifyOtpBodyParams = z.infer<typeof VerifyOtpBody>;
