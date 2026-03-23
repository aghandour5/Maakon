import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { db } from "@workspace/db";
import { postsTable, ngosTable } from "@workspace/db/schema";
import { and, eq, gt, isNull, or, desc } from "drizzle-orm";
import {
  ListPostsQueryParams,
  CreatePostBody,
  GetPostParams,
} from "@workspace/api-zod";
import * as apiZod from "@workspace/api-zod";
import { getPublicCoordinates } from "../lib/post-location";

const router: IRouter = Router();
const ngosTableWithUserId = ngosTable as typeof ngosTable & {
  userId: unknown;
};
const UpdatePostBody = (apiZod as unknown as {
  UpdatePostBody: { safeParse: (input: unknown) => { success: boolean; data?: any } };
}).UpdatePostBody;

function toPublicPost(post: typeof postsTable.$inferSelect) {
  const { lat: publicLat, lng: publicLng } =
    post.publicLat != null && post.publicLng != null
      ? clampCoastalCoords(
          post.publicLat,
          post.publicLng,
          post.district,
          post.governorate,
        )
      : { lat: null, lng: null };

  return {
    id: post.id,
    userId: post.userId,
    postType: post.postType,
    title: post.title,
    category: post.category,
    description: post.description,
    urgency: post.urgency ?? null,
    governorate: post.governorate,
    district: post.district ?? null,
    publicLat: publicLat ?? null,
    publicLng: publicLng ?? null,
    providerType: post.providerType ?? null,
    verifiedBadgeType: post.verifiedBadgeType ?? null,
    contactMethod: post.contactMethod ?? null,
    contactInfo: post.contactInfo ?? null,
    status: post.status,
    reportCount: post.reportCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    expiresAt: post.expiresAt ?? null,
    lastConfirmedAt: post.lastConfirmedAt ?? null,
  };
}

function toPrivatePost(post: typeof postsTable.$inferSelect) {
  return {
    ...toPublicPost(post),
    privateLat: post.privateLat ?? null,
    privateLng: post.privateLng ?? null,
    exactAddressPrivate: post.exactAddressPrivate ?? null,
  };
}

const COASTAL_BOUNDS: Record<string, [number, number, number, number]> = {
  Beirut: [33.85, 33.93, 35.49, 35.56],
  "Beirut City": [33.85, 33.93, 35.49, 35.56],
};

function clampCoastalCoords(
  lat: number,
  lng: number,
  district: string | null | undefined,
  governorate: string,
): { lat: number; lng: number } {
  const bounds = COASTAL_BOUNDS[district ?? ""] ?? COASTAL_BOUNDS[governorate];

  if (!bounds) {
    return { lat, lng };
  }

  const [minLat, maxLat, minLng, maxLng] = bounds;
  return {
    lat: Math.min(Math.max(lat, minLat), maxLat),
    lng: Math.min(Math.max(lng, minLng), maxLng),
  };
}

function isPubliclyVisiblePost(post: typeof postsTable.$inferSelect): boolean {
  if (post.status !== "active") {
    return false;
  }

  return !post.expiresAt || post.expiresAt.getTime() > Date.now();
}

router.get("/posts", async (req, res) => {
  const query = ListPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res
      .status(400)
      .json({ error: "Invalid query parameters", details: String(query.error) });
    return;
  }

  let {
    postType,
    category,
    governorate,
    district,
    urgency,
    activeOnly,
    verifiedNgoOnly,
  } = query.data;

  if (req.query.activeOnly === "false") activeOnly = false;
  if (req.query.verifiedNgoOnly === "false") verifiedNgoOnly = false;

  const filters = [];
  if (postType) filters.push(eq(postsTable.postType, postType));
  if (category) filters.push(eq(postsTable.category, category));
  if (governorate) filters.push(eq(postsTable.governorate, governorate));
  if (district) filters.push(eq(postsTable.district, district));
  if (urgency) filters.push(eq(postsTable.urgency, urgency));
  if (verifiedNgoOnly) filters.push(eq(postsTable.verifiedBadgeType, "ngo"));
  if (activeOnly !== false) {
    filters.push(eq(postsTable.status, "active"));
    const now = new Date();
    filters.push(or(isNull(postsTable.expiresAt), gt(postsTable.expiresAt, now))!);
  }

  const rows = await db
    .select({
      post: postsTable,
      ngoId: ngosTableWithUserId.id,
    })
    .from(postsTable)
    .leftJoin(ngosTableWithUserId, eq(postsTable.userId, ngosTableWithUserId.userId as any))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(postsTable.createdAt);

  res.json(rows.map(({ post, ngoId }) => ({
    ...toPublicPost(post),
    ngoId: post.providerType === "ngo" ? ngoId : null,
  })));
});

router.post("/posts", requireAuth, async (req, res) => {
  const body = CreatePostBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation failed", details: String(body.error) });
    return;
  }

  const {
    postType,
    title,
    category,
    description,
    urgency,
    governorate,
    district,
    exactAddressPrivate,
    providerType,
    contactMethod,
    contactInfo,
    providedLat,
    providedLng,
    expiresInDays,
  } = body.data as typeof body.data & {
    providedLat?: number | null;
    providedLng?: number | null;
  };

  const { publicLat, publicLng } = getPublicCoordinates(
    postType,
    governorate,
    district,
    providedLat,
    providedLng,
    providerType,
  );

  let verifiedBadgeType: "ngo" | null = null;
  let ngoId: number | null = null;
  if (providerType === "ngo") {
    let [ngo] = await db
      .select()
      .from(ngosTable)
      .where(eq(ngosTableWithUserId.userId as never, req.user!.id))
      .limit(1);

    if (!ngo) {
      // Auto-create unverified NGO so it appears in the admin console
      const [newNgo] = await db
        .insert(ngosTable)
        .values({
          name: title, // Initially use post title as NGO name
          description: description,
          governorate: governorate,
          district: district ?? null,
          lat: providedLat ?? null,
          lng: providedLng ?? null,
          phone: contactInfo ?? null,
          status: "active",
        } as any) // Cast required due to inference limits
        .returning();
      
      // Link userId using the locally defined type
      await db
        .update(ngosTableWithUserId)
        .set({ userId: req.user!.id } as any)
        .where(eq(ngosTable.id, newNgo.id));
      ngo = newNgo;
    }

    ngoId = ngo.id;
    if (ngo && ngo.verifiedAt) {
      verifiedBadgeType = "ngo";
    }
  }

  const daysUntilExpiry =
    expiresInDays && expiresInDays > 0 ? Math.min(expiresInDays, 90) : 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysUntilExpiry);

  const [post] = await db
    .insert(postsTable)
    .values({
      postType,
      title,
      category,
      description,
      urgency: urgency ?? null,
      governorate,
      district: district ?? null,
      publicLat,
      publicLng,
      privateLat: providedLat ?? null,
      privateLng: providedLng ?? null,
      exactAddressPrivate: exactAddressPrivate ?? null,
      providerType: providerType ?? null,
      verifiedBadgeType,
      contactMethod: contactMethod ?? null,
      contactInfo: contactInfo ?? null,
      status: "active",
      userId: req.user!.id,
      expiresAt,
      lastConfirmedAt: new Date(),
    })
    .returning();

  res.status(201).json({
    ...toPublicPost(post),
    ngoId,
  });
});

router.get("/posts/me", requireAuth, async (req, res) => {
  const rows = await db
    .select({
      post: postsTable,
      ngoId: ngosTableWithUserId.id,
    })
    .from(postsTable)
    .leftJoin(ngosTableWithUserId, eq(postsTable.userId, ngosTableWithUserId.userId as any))
    .where(eq(postsTable.userId, req.user!.id))
    .orderBy(desc(postsTable.createdAt));

  res.json(rows.map(({ post, ngoId }) => ({
    ...toPrivatePost(post),
    ngoId: post.providerType === "ngo" ? ngoId : null,
  })));
});

router.patch("/posts/:id", requireAuth, async (req, res) => {
  const params = GetPostParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return void res.status(400).json({ error: "Invalid post ID" });

  const body = UpdatePostBody.safeParse(req.body);
  if (!body.success) return void res.status(400).json({ error: "Validation failed" });

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, params.data.id))
    .limit(1);

  if (!post) return void res.status(404).json({ error: "Post not found" });
  if (post.userId !== req.user!.id) return void res.status(403).json({ error: "Forbidden" });

  const { title, description, status } = body.data;

  const [updatedPost] = await db
    .update(postsTable)
    .set({
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(status ? { status } : {}),
      updatedAt: new Date(),
    })
    .where(eq(postsTable.id, post.id))
    .returning();

  res.json(toPrivatePost(updatedPost));
});

router.delete("/posts/:id", requireAuth, async (req, res) => {
  const params = GetPostParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return void res.status(400).json({ error: "Invalid post ID" });

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, params.data.id))
    .limit(1);

  if (!post) return void res.status(404).json({ error: "Post not found" });
  if (post.userId !== req.user!.id) return void res.status(403).json({ error: "Forbidden" });

  await db.delete(postsTable).where(eq(postsTable.id, post.id));

  res.status(204).send();
});

router.get("/posts/:id", async (req, res) => {
  const params = GetPostParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }

  const [row] = await db
    .select({
      post: postsTable,
      ngoId: ngosTableWithUserId.id,
    })
    .from(postsTable)
    .leftJoin(ngosTableWithUserId, eq(postsTable.userId, ngosTableWithUserId.userId as any))
    .where(eq(postsTable.id, params.data.id))
    .limit(1);

  if (!row || !isPubliclyVisiblePost(row.post)) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json({
    ...toPublicPost(row.post),
    ngoId: row.post.providerType === "ngo" ? row.ngoId : null,
  });
});

export default router;
