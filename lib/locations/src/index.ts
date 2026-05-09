export type Coordinates = {
  lat: number;
  lng: number;
};

export type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export const CATEGORIES = [
  "food",
  "shelter",
  "medical",
  "clothing",
  "water",
  "transportation",
  "legal",
  "psychological",
  "education",
  "volunteers",
  "other",
] as const;

export const GOVERNORATES = [
  "Beirut",
  "Mount Lebanon",
  "North Lebanon",
  "South Lebanon",
  "Nabatieh",
  "Bekaa",
  "Akkar",
  "Baalbek-Hermel",
] as const;

export const DISTRICTS = {
  Beirut: ["Beirut City"],
  "Mount Lebanon": ["Baabda", "Aley", "Chouf", "Matn", "Keserwan", "Jbeil", "Metn"],
  "North Lebanon": ["Tripoli", "Miniyeh-Danniyeh", "Zgharta", "Bcharre", "Koura", "Batroun"],
  "South Lebanon": ["Sidon", "Jezzine", "Tyre"],
  Nabatieh: ["Nabatieh", "Bint Jbeil", "Hasbaya", "Marjayoun"],
  Bekaa: ["Zahle", "Baalbek", "West Bekaa", "Rachaya"],
  Akkar: ["Akkar", "Halba"],
  "Baalbek-Hermel": ["Baalbek", "Hermel"],
} as const satisfies Record<string, readonly string[]>;

export const URGENCY_LEVELS = ["critical", "high", "medium", "low"] as const;
export const PROVIDER_TYPES = ["individual", "organization", "business", "ngo"] as const;
export const CONTACT_METHODS = ["phone", "whatsapp", "email", "signal", "in-person"] as const;

export const DEFAULT_LEBANON_CENTER: Coordinates = { lat: 33.8547, lng: 35.8623 };

export const GOVERNORATE_CENTERS = {
  Beirut: { lat: 33.8938, lng: 35.5018 },
  "Mount Lebanon": { lat: 33.81, lng: 35.6 },
  "North Lebanon": { lat: 34.4333, lng: 35.8333 },
  "South Lebanon": { lat: 33.2717, lng: 35.2033 },
  Nabatieh: { lat: 33.3772, lng: 35.484 },
  Bekaa: { lat: 33.85, lng: 35.9017 },
  Akkar: { lat: 34.5581, lng: 36.0808 },
  "Baalbek-Hermel": { lat: 34.0049, lng: 36.2098 },
} as const satisfies Record<string, Coordinates>;

export const DISTRICT_CENTERS = {
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
} as const satisfies Record<string, Coordinates>;

export const LOCATION_BOUNDS = {
  Beirut: { minLat: 33.85, maxLat: 33.93, minLng: 35.49, maxLng: 35.56 },
  "Beirut City": { minLat: 33.85, maxLat: 33.93, minLng: 35.49, maxLng: 35.56 },
  "Mount Lebanon": { minLat: 33.45, maxLat: 34.22, minLng: 35.35, maxLng: 36.05 },
  "North Lebanon": { minLat: 34.12, maxLat: 34.58, minLng: 35.6, maxLng: 36.25 },
  "South Lebanon": { minLat: 33.05, maxLat: 33.65, minLng: 35.05, maxLng: 35.75 },
  Nabatieh: { minLat: 33.05, maxLat: 33.55, minLng: 35.25, maxLng: 35.85 },
  Bekaa: { minLat: 33.35, maxLat: 34.2, minLng: 35.65, maxLng: 36.35 },
  Akkar: { minLat: 34.45, maxLat: 34.7, minLng: 35.85, maxLng: 36.35 },
  "Baalbek-Hermel": { minLat: 33.8, maxLat: 34.65, minLng: 36.0, maxLng: 36.65 },
} as const satisfies Record<string, Bounds>;

export type Governorate = (typeof GOVERNORATES)[number];

export function isValidGovernorate(value: string | null | undefined): value is Governorate {
  return typeof value === "string" && GOVERNORATES.includes(value as Governorate);
}

export function getDistrictsForGovernorate(governorate: string | null | undefined): readonly string[] {
  return isValidGovernorate(governorate) ? DISTRICTS[governorate] : [];
}

export function isValidDistrictForGovernorate(
  governorate: string | null | undefined,
  district: string | null | undefined,
): boolean {
  if (district == null || district === "") {
    return true;
  }

  return getDistrictsForGovernorate(governorate).includes(district);
}

export function isValidLocation(
  governorate: string | null | undefined,
  district?: string | null | undefined,
): boolean {
  return isValidGovernorate(governorate) && isValidDistrictForGovernorate(governorate, district);
}

export function getLocationCenter(
  governorate: string,
  district?: string | null,
): Coordinates {
  if (district && district in DISTRICT_CENTERS) {
    return DISTRICT_CENTERS[district as keyof typeof DISTRICT_CENTERS];
  }

  if (governorate in GOVERNORATE_CENTERS) {
    return GOVERNORATE_CENTERS[governorate as keyof typeof GOVERNORATE_CENTERS];
  }

  return DEFAULT_LEBANON_CENTER;
}

export function clampLocationCoordinates(
  lat: number,
  lng: number,
  governorate: string,
  district?: string | null,
): Coordinates {
  const bounds =
    (district && LOCATION_BOUNDS[district as keyof typeof LOCATION_BOUNDS]) ||
    LOCATION_BOUNDS[governorate as keyof typeof LOCATION_BOUNDS];

  if (!bounds) {
    return { lat, lng };
  }

  return {
    lat: Math.min(Math.max(lat, bounds.minLat), bounds.maxLat),
    lng: Math.min(Math.max(lng, bounds.minLng), bounds.maxLng),
  };
}
