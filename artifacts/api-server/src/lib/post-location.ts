import {
  clampLocationCoordinates,
  getLocationCenter,
} from "@workspace/locations";

type NullableString = string | null | undefined;
type NullableNumber = number | null | undefined;

function fuzzCoordinate(
  coord: number,
  isLng = false,
  regionName?: NullableString,
): number {
  let jitter = (Math.random() - 0.5) * 0.1;

  if (regionName === "Beirut City" || regionName === "Beirut") {
    jitter = isLng
      ? Math.random() * 0.05
      : (Math.random() - 0.5) * 0.04;
  }

  return Math.round((coord + jitter) * 10000) / 10000;
}

export function getPublicCoordinates(
  postType: "need" | "offer",
  governorate: string,
  district?: NullableString,
  providedLat?: NullableNumber,
  providedLng?: NullableNumber,
  providerType?: NullableString,
) {
  if (postType === "need" && providerType !== "ngo") {
    const center = getLocationCenter(governorate, district);

    return {
      publicLat: fuzzCoordinate(center.lat, false, district || governorate),
      publicLng: fuzzCoordinate(center.lng, true, district || governorate),
    };
  }

  if (providedLat != null && providedLng != null) {
    const clamped = clampLocationCoordinates(
      providedLat,
      providedLng,
      governorate,
      district,
    );
    return { publicLat: clamped.lat, publicLng: clamped.lng };
  }

  const center = getLocationCenter(governorate, district);

  return { publicLat: center.lat, publicLng: center.lng };
}
