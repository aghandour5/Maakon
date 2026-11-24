import { isValidGovernorate, isValidLocation } from "@workspace/locations";

const DRAFT_REFERRAL_KEY = "draftReferral";

export type DraftReferral = { governorate: string; district: string | null };

export function getGiveHref(governorate?: string | null, district?: string | null): string {
  if (!isValidGovernorate(governorate)) return "/give";
  const params = new URLSearchParams({ governorate });
  if (district && isValidLocation(governorate, district)) params.set("district", district);
  return `/give?${params}`;
}

export function saveDraftReferral(referral: DraftReferral): void {
  try {
    sessionStorage.setItem(DRAFT_REFERRAL_KEY, getGiveHref(referral.governorate, referral.district));
  } catch {
    // A browser may disable session storage. The sign-in session is still valid.
  }
}

export function takeDraftReferral(): string | null {
  try {
    const href = sessionStorage.getItem(DRAFT_REFERRAL_KEY);
    sessionStorage.removeItem(DRAFT_REFERRAL_KEY);
    return href === "/give" || href?.startsWith("/give?") ? href : null;
  } catch {
    return null;
  }
}
