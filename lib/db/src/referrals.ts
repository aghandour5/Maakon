import type { Ngo } from "./schema/ngos";

export function hasUsablePublicPhone(phone: string | null): boolean {
  return (phone?.replace(/\D/g, "").length ?? 0) >= 3;
}

export function normalizePublicWebsite(website: string | null): string | null {
  const value = website?.trim();
  if (!value) return null;

  try {
    const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
    const url = new URL(hasScheme ? value : `https://${value}`);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !/^[a-z\d-]+(?:\.[a-z\d-]+)+\.?$/i.test(url.hostname) ||
      url.username || url.password
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

export function hasUsablePublicContact(ngo: Pick<Ngo, "phone" | "website">): boolean {
  return hasUsablePublicPhone(ngo.phone) || normalizePublicWebsite(ngo.website) !== null;
}

export function getReferralApprovalError(
  ngo: Pick<Ngo, "status" | "verifiedAt" | "phone" | "website">,
): string | null {
  if (ngo.status !== "active") return "The organization must be active.";
  if (!ngo.verifiedAt) return "Verify the organization before approving it for referrals.";
  if (!hasUsablePublicContact(ngo)) return "Add a public phone number or website.";
  return null;
}
