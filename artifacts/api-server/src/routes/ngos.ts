import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ngosTable } from "@workspace/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { ListNearbyNgosQueryParams, ListNgosQueryParams } from "@workspace/api-zod";
import { getLocationCenter, isValidGovernorate, isValidLocation } from "@workspace/locations";
import { rankReferralPartners } from "../lib/partner-referrals";

function fuzzCoordinate(coord: number): number {
  const jitter = (Math.random() - 0.5) * 0.1;
  return Math.round((coord + jitter) * 10000) / 10000;
}

const router: IRouter = Router();

function toPublicNgo(ngo: typeof ngosTable.$inferSelect) {
  return {
    id: ngo.id,
    name: ngo.name,
    description: ngo.description ?? null,
    governorate: ngo.governorate,
    district: ngo.district ?? null,
    lat: ngo.lat ?? null,
    lng: ngo.lng ?? null,
    phone: ngo.phone ?? null,
    website: ngo.website ?? null,
    verifiedAt: ngo.verifiedAt ?? null,
    createdAt: ngo.createdAt,
  };
}

router.get("/ngos", async (req, res) => {
  const query = ListNgosQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { governorate } = query.data;
  if (governorate && !isValidGovernorate(governorate)) {
    res.status(400).json({ error: "Invalid governorate" });
    return;
  }

  const allNgos = await db
    .select()
    .from(ngosTable)
    .where(eq(ngosTable.status, "active"));

  const filtered = governorate
    ? allNgos.filter((n) => n.governorate === governorate)
    : allNgos;

  const mapped = filtered.map(ngo => {
    if (ngo.lat != null && ngo.lng != null) return toPublicNgo(ngo);
    const center = getLocationCenter(ngo.governorate, ngo.district);
    return toPublicNgo({
      ...ngo,
      lat: fuzzCoordinate(center.lat),
      lng: fuzzCoordinate(center.lng)
    });
  });

  res.json(mapped);
});

router.get("/ngos/nearby", async (req, res) => {
  const query = ListNearbyNgosQueryParams.safeParse(req.query);
  if (!query.success || !isValidLocation(query.data.governorate, query.data.district)) {
    return void res.status(400).json({ error: "Invalid governorate or district" });
  }

  const ngos = await db.select().from(ngosTable).where(and(
    eq(ngosTable.status, "active"),
    isNotNull(ngosTable.verifiedAt),
    isNotNull(ngosTable.referralApprovedAt),
  ));

  res.json(rankReferralPartners(ngos, query.data));
});

export default router;
