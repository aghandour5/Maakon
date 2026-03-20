import { Router, type IRouter } from "express";
import { GetMetadataResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const CATEGORIES = [
  "food",
  "shelter",
  "medical",
  "clothing",
  "water",
  "transportation",
  "legal",
  "psychological",
  "education",
  "other",
];

const GOVERNORATES = [
  "Beirut",
  "Mount Lebanon",
  "North Lebanon",
  "South Lebanon",
  "Nabatieh",
  "Bekaa",
  "Akkar",
  "Baalbek-Hermel",
];

const DISTRICTS: Record<string, string[]> = {
  "Beirut": ["Beirut City"],
  "Mount Lebanon": ["Baabda", "Aley", "Chouf", "Matn", "Keserwan", "Jbeil", "Metn"],
  "North Lebanon": ["Tripoli", "Miniyeh-Danniyeh", "Zgharta", "Bcharre", "Koura", "Batroun"],
  "South Lebanon": ["Sidon", "Jezzine", "Tyre"],
  "Nabatieh": ["Nabatieh", "Bint Jbeil", "Hasbaya", "Marjayoun"],
  "Bekaa": ["Zahle", "Baalbek", "West Bekaa", "Rachaya"],
  "Akkar": ["Akkar", "Halba"],
  "Baalbek-Hermel": ["Baalbek", "Hermel"],
};

const URGENCY_LEVELS = ["critical", "high", "medium", "low"];
const PROVIDER_TYPES = ["individual", "organization", "business", "ngo"];
const CONTACT_METHODS = ["phone", "whatsapp", "email", "signal", "in-person"];

router.get("/metadata", (_req, res) => {
  const data = GetMetadataResponse.parse({
    categories: CATEGORIES,
    governorates: GOVERNORATES,
    districts: DISTRICTS,
    urgencyLevels: URGENCY_LEVELS,
    providerTypes: PROVIDER_TYPES,
    contactMethods: CONTACT_METHODS,
  });
  res.json(data);
});

export default router;
