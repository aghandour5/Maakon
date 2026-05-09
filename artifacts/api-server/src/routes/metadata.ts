import { Router, type IRouter } from "express";
import { GetMetadataResponse } from "@workspace/api-zod";
import {
  CATEGORIES,
  CONTACT_METHODS,
  DISTRICTS,
  GOVERNORATES,
  PROVIDER_TYPES,
  URGENCY_LEVELS,
} from "@workspace/locations";

const router: IRouter = Router();

router.get("/metadata", (_req, res) => {
  const data = GetMetadataResponse.parse({
    categories: [...CATEGORIES],
    governorates: [...GOVERNORATES],
    districts: Object.fromEntries(
      Object.entries(DISTRICTS).map(([governorate, districts]) => [
        governorate,
        [...districts],
      ]),
    ),
    urgencyLevels: [...URGENCY_LEVELS],
    providerTypes: [...PROVIDER_TYPES],
    contactMethods: [...CONTACT_METHODS],
  });
  res.json(data);
});

export default router;
