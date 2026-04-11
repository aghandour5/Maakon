import { z } from "zod";

// ── Firebase Email Link auth ──────────────────────────────────────────────────

export const FirebaseLoginBody = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),
  accountType: z.enum(["individual", "ngo"]).optional(),
  /** Optional draft token to claim a post after email-link sign-in */
  draftToken: z.string().optional(),
});
export type FirebaseLoginBodyParams = z.infer<typeof FirebaseLoginBody>;

// ── Profile completion ────────────────────────────────────────────────────────

export const CompleteProfileBody = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
});
export type CompleteProfileBodyParams = z.infer<typeof CompleteProfileBody>;

export const CompleteNgoProfileBody = z.object({
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
  governorate: z.string().min(1, "Governorate is required"),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format. Must include country code (e.g. +961...)").optional(),
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

