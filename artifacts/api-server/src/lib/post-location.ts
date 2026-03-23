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

const GOVERNORATE_CENTERS: Record<string, { lat: number; lng: number }> = {
  Beirut: { lat: 33.8938, lng: 35.5018 },
  "Mount Lebanon": { lat: 33.81, lng: 35.6 },
  "North Lebanon": { lat: 34.4333, lng: 35.8333 },
  "South Lebanon": { lat: 33.2717, lng: 35.2033 },
  Nabatieh: { lat: 33.3772, lng: 35.484 },
  Bekaa: { lat: 33.85, lng: 35.9017 },
  Akkar: { lat: 34.5581, lng: 36.0808 },
  "Baalbek-Hermel": { lat: 34.0049, lng: 36.2098 },
};

const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Beirut City": { lat: 33.8938, lng: 35.5018 },
  Baabda: { lat: 33.8333, lng: 35.5333 },
  Aley: { lat: 33.805, lng: 35.602 },
  Chouf: { lat: 33.69, lng: 35.57 },
  Matn: { lat: 33.89, lng: 35.57 },
  Metn: { lat: 33.89, lng: 35.57 },
  Keserwan: { lat: 33.98, lng: 35.64 },
  Jbeil: { lat: 34.12, lng: 35.65 },
  Tripoli: { lat: 34.4333, lng: 35.8333 },
  "Miniyeh-Danniyeh": { lat: 34.38, lng: 36.02 },
  Zgharta: { lat: 34.39, lng: 35.89 },
  Bcharre: { lat: 34.25, lng: 36.01 },
  Koura: { lat: 34.31, lng: 35.81 },
  Batroun: { lat: 34.25, lng: 35.66 },
  Sidon: { lat: 33.56, lng: 35.37 },
  Jezzine: { lat: 33.54, lng: 35.58 },
  Tyre: { lat: 33.27, lng: 35.2 },
  Nabatieh: { lat: 33.37, lng: 35.48 },
  "Bint Jbeil": { lat: 33.12, lng: 35.43 },
  Hasbaya: { lat: 33.39, lng: 35.68 },
  Marjayoun: { lat: 33.36, lng: 35.59 },
  Zahle: { lat: 33.85, lng: 35.9 },
  "West Bekaa": { lat: 33.63, lng: 35.79 },
  Rachaya: { lat: 33.5, lng: 35.84 },
  Akkar: { lat: 34.55, lng: 36.08 },
  Halba: { lat: 34.54, lng: 36.08 },
  Baalbek: { lat: 34.0, lng: 36.21 },
  Hermel: { lat: 34.39, lng: 36.38 },
};

export function getPublicCoordinates(
  postType: "need" | "offer",
  governorate: string,
  district?: NullableString,
  providedLat?: NullableNumber,
  providedLng?: NullableNumber,
  providerType?: NullableString,
) {
  if (postType === "need" && providerType !== "ngo") {
    const centerFallback = GOVERNORATE_CENTERS[governorate] ?? {
      lat: 33.8547,
      lng: 35.8623,
    };
    const center =
      district && DISTRICT_CENTERS[district]
        ? DISTRICT_CENTERS[district]
        : centerFallback;

    return {
      publicLat: fuzzCoordinate(center.lat, false, district || governorate),
      publicLng: fuzzCoordinate(center.lng, true, district || governorate),
    };
  }

  if (providedLat != null && providedLng != null) {
    return { publicLat: providedLat, publicLng: providedLng };
  }

  const centerFallback = GOVERNORATE_CENTERS[governorate] ?? {
    lat: 33.8547,
    lng: 35.8623,
  };
  const center =
    district && DISTRICT_CENTERS[district]
      ? DISTRICT_CENTERS[district]
      : centerFallback;

  return { publicLat: center.lat, publicLng: center.lng };
}
