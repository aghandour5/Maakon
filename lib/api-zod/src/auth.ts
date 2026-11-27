import { z } from "zod";

// ── Supabase Email Link auth ──────────────────────────────────────────────────

export const SupabaseLoginBody = z.object({
  idToken: z.string().min(1, "Supabase access token is required"),
  accountType: z.enum(["individual", "ngo"]).optional(),
  /** Optional draft token to claim a post after email-link sign-in */
  draftToken: z.string().optional(),
});
export type SupabaseLoginBodyParams = z.infer<typeof SupabaseLoginBody>;

// ── Profile completion ────────────────────────────────────────────────────────

export const profilePhonePattern = /^\+[1-9]\d{5,14}$/;
export const normalizeProfilePhone = (phone: string) => phone.replace(/\s/g, "");

export const CompleteProfileBody = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  governorate: z.string().min(1),
  district: z.string().optional(),
  phone: z.string().transform(normalizeProfilePhone).pipe(z.string().regex(profilePhonePattern)),
});
export type CompleteProfileBodyParams = z.infer<typeof CompleteProfileBody>;

export const CompleteNgoProfileBody = z.object({
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
  governorate: z.string().min(1, "Governorate is required"),
  district: z.string().optional(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format. Must include country code (e.g. +961...)").optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
export type CompleteNgoProfileBodyParams = z.infer<typeof CompleteNgoProfileBody>;

// ── Draft post creation (unauthenticated) ─────────────────────────────────────

export function validPublicContact(method?: string | null, value?: string | null): boolean {
  const info = value?.trim();
  if (!method && !info) return true;
  if (!info || info.length > 2048) return false;
  if (method === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info);
  if (method === "phone") return /^\+?[\d ()-]+$/.test(info) && /^\d{6,15}$/.test(info.replace(/\D/g, ""));
  if (method !== "website") return false;
  return /^https?:\/\//i.test(info) && z.string().url().safeParse(info).success;
}

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
  publicContactMethod: z.enum(["phone", "email", "website"]).optional(),
  publicContactInfo: z.string().trim().max(2048).optional(),
  expiresInDays: z.number().int().min(1).max(90).optional(),
  providedLat: z.number().optional(),
  providedLng: z.number().optional(),
});
export type CreateDraftPostBodyParams = z.infer<typeof CreateDraftPostBody>;
