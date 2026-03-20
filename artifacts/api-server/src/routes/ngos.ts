import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ngosTable } from "@workspace/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { ListNgosQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ngos", async (req, res) => {
  const query = ListNgosQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { governorate } = query.data;

  const conditions = [isNotNull(ngosTable.verifiedAt)];
  if (governorate) {
    conditions.push(eq(ngosTable.governorate, governorate));
  }

  const ngos = await db
    .select()
    .from(ngosTable)
    .where(conditions.length === 1 ? conditions[0] : undefined);

  // If governorate filter is set, apply manually (simple approach)
  const filtered = governorate
    ? ngos.filter((n) => n.governorate === governorate && n.verifiedAt !== null)
    : ngos.filter((n) => n.verifiedAt !== null);

  res.json(filtered);
});

export default router;
