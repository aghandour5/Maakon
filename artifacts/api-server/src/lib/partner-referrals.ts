import type { NearbyNgosResponse, ReferralPartner } from "@workspace/api-zod";
import type { Ngo } from "@workspace/db/schema";
import {
  getReferralApprovalError,
  hasUsablePublicPhone,
  normalizePublicWebsite,
} from "@workspace/db/referrals";
import { getLocationCenter, haversineKm, LEBANON_BOUNDS } from "@workspace/locations";

export { hasUsablePublicContact } from "@workspace/db/referrals";

type ReferralCandidate = Pick<
  Ngo,
  "id" | "name" | "description" | "governorate" | "district" |
  "lat" | "lng" | "phone" | "website" | "status" | "verifiedAt" | "referralApprovedAt"
>;

const SECTION_LIMIT = 5;
const nameOrder = new Intl.Collator("en", { sensitivity: "accent" });

export function isReferralEligible(ngo: ReferralCandidate): boolean {
  return Boolean(ngo.referralApprovedAt) && getReferralApprovalError(ngo) === null;
}

function comparePartners(a: ReferralCandidate, b: ReferralCandidate): number {
  return nameOrder.compare(a.name, b.name) || a.id - b.id;
}

function toReferralPartner(ngo: ReferralCandidate, match: ReferralPartner["match"]): ReferralPartner {
  return {
    id: ngo.id,
    name: ngo.name,
    description: ngo.description,
    governorate: ngo.governorate,
    district: ngo.district,
    phone: hasUsablePublicPhone(ngo.phone) ? ngo.phone : null,
    website: normalizePublicWebsite(ngo.website),
    match,
  };
}

export function rankReferralPartners(
  ngos: readonly ReferralCandidate[],
  area: { governorate: string; district: string },
): NearbyNgosResponse {
  const center = getLocationCenter(area.governorate, area.district);
  const { minLat, maxLat, minLng, maxLng } = LEBANON_BOUNDS;
  const distances: { ngo: ReferralCandidate; distanceKm: number; sameDistrict: boolean }[] = [];
  const areas: { ngo: ReferralCandidate; level: "district" | "governorate" }[] = [];

  for (const ngo of ngos) {
    if (!isReferralEligible(ngo)) continue;

    const sameGovernorate = ngo.governorate === area.governorate;
    const sameDistrict = sameGovernorate && ngo.district === area.district;
    const { lat, lng } = ngo;
    if (lat != null && lng != null && lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      distances.push({ ngo, distanceKm: haversineKm(center, { lat, lng }), sameDistrict });
    } else if (sameGovernorate) {
      areas.push({ ngo, level: sameDistrict ? "district" : "governorate" });
    }
  }

  distances.sort((a, b) =>
    a.distanceKm - b.distanceKm ||
    Number(b.sameDistrict) - Number(a.sameDistrict) ||
    comparePartners(a.ngo, b.ngo),
  );
  areas.sort((a, b) =>
    Number(b.level === "district") - Number(a.level === "district") ||
    comparePartners(a.ngo, b.ngo),
  );

  return {
    distanceMatches: distances.slice(0, SECTION_LIMIT).map(({ ngo, distanceKm }) =>
      toReferralPartner(ngo, { type: "distance", distanceKm }),
    ),
    areaMatches: areas.slice(0, SECTION_LIMIT).map(({ ngo, level }) =>
      toReferralPartner(ngo, { type: "area", level }),
    ),
  };
}
