import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ngosTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ListNgosQueryParams } from "@workspace/api-zod";
import { getLocationCenter, isValidGovernorate } from "@workspace/locations";

function fuzzCoordinate(coord: number): number {
  const jitter = (Math.random() - 0.5) * 0.1;
  return Math.round((coord + jitter) * 10000) / 10000;
}

const router: IRouter = Router();

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
    if (ngo.lat && ngo.lng) return ngo;
    const center = getLocationCenter(ngo.governorate, ngo.district);
    return {
      ...ngo,
      lat: fuzzCoordinate(center.lat),
      lng: fuzzCoordinate(center.lng)
    };
  });

  res.json(mapped);
});

export default router;
