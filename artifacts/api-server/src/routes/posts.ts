import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { rateLimit } from "../middlewares/rateLimit";
import { db } from "@workspace/db";
import { postsTable, ngosTable } from "@workspace/db/schema";
import { and, eq, gt, isNull, or, desc } from "drizzle-orm";
import {
  ListPostsQueryParams,
  CreatePostBody,
  GetPostParams,
  UpdatePostBody,
} from "@workspace/api-zod";
import {
  clampLocationCoordinates,
  isValidGovernorate,
  isValidLocation,
} from "@workspace/locations";
import { getPublicCoordinates } from "../lib/post-location";
import { logger } from "../lib/logger";

const DEFAULT_EXPIRY_DAYS = 30;
const MAX_EXPIRY_DAYS = 90;

const router: IRouter = Router();
const createPostRateLimiter = rateLimit(
  15 * 60 * 1000,
  20,
  "Too many post submissions, please try again after 15 minutes.",
);

function toPublicPost(post: typeof postsTable.$inferSelect) {
  const { lat: publicLat, lng: publicLng } =
    post.publicLat != null && post.publicLng != null
      ? clampLocationCoordinates(
          post.publicLat,
          post.publicLng,
          post.governorate,
          post.district,
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

function isPubliclyVisiblePost(post: typeof postsTable.$inferSelect): boolean {
  if (post.status !== "active") {
    return false;
  }

  return !post.expiresAt || post.expiresAt.getTime() > Date.now();
}

router.get("/posts", async (req, res) => {
  const query = ListPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    logger.warn({ err: query.error, path: req.originalUrl }, "Invalid list-posts query");
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const {
    postType,
    category,
    governorate,
    district,
    urgency,
    activeOnly,
    verifiedNgoOnly,
    page,
    limit,
  } = query.data;

  if (governorate && !isValidGovernorate(governorate)) {
    res.status(400).json({ error: "Invalid governorate" });
    return;
  }

  if (district && !isValidLocation(governorate, district)) {
    res.status(400).json({ error: "Invalid district for governorate" });
    return;
  }

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
      ngoId: ngosTable.id,
    })
    .from(postsTable)
    .leftJoin(ngosTable, eq(postsTable.userId, ngosTable.userId))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  res.json(rows.map(({ post, ngoId }) => ({
    ...toPublicPost(post),
    ngoId: post.providerType === "ngo" ? ngoId : null,
  })));
});

router.post("/posts", requireAuth, createPostRateLimiter, async (req, res) => {
  const body = CreatePostBody.safeParse(req.body);
  if (!body.success) {
    logger.warn({ err: body.error, path: req.originalUrl }, "Create post validation failed");
    res.status(400).json({ error: "Validation failed" });
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
  } = body.data;

  if (!isValidLocation(governorate, district)) {
    res.status(400).json({ error: "Invalid governorate or district" });
    return;
  }

  const { publicLat, publicLng } = getPublicCoordinates(
    postType,
    governorate,
    district,
    providedLat,
    providedLng,
    providerType,
  );

  const daysUntilExpiry =
    expiresInDays && expiresInDays > 0
      ? Math.min(expiresInDays, MAX_EXPIRY_DAYS)
      : DEFAULT_EXPIRY_DAYS;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysUntilExpiry);

  const { post, ngoId } = await db.transaction(async (tx) => {
    let verifiedBadgeType: "ngo" | null = null;
    let ngoId: number | null = null;

    if (providerType === "ngo") {
      let [ngo] = await tx
        .select()
        .from(ngosTable)
        .where(eq(ngosTable.userId, req.user!.id))
        .limit(1);

      if (!ngo) {
        // Auto-create unverified NGO so it appears in the admin console.
        [ngo] = await tx
          .insert(ngosTable)
          .values({
            userId: req.user!.id,
            name: title,
            description,
            governorate,
            district: district ?? null,
            lat: providedLat ?? null,
            lng: providedLng ?? null,
            phone: contactInfo ?? null,
            status: "active",
          })
          .returning();
      }

      ngoId = ngo.id;
      if (ngo.verifiedAt) {
        verifiedBadgeType = "ngo";
      }
    }

    const [post] = await tx
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

    return { post, ngoId };
  });

  res.status(201).json({
    ...toPublicPost(post),
    ngoId,
  });
});

router.get("/posts/me", requireAuth, async (req, res) => {
  const rows = await db
    .select({
      post: postsTable,
      ngoId: ngosTable.id,
    })
    .from(postsTable)
    .leftJoin(ngosTable, eq(postsTable.userId, ngosTable.userId))
    .where(eq(postsTable.userId, req.user!.id))
    .orderBy(desc(postsTable.createdAt));

  res.json(rows.map(({ post, ngoId }) => ({
    ...toPrivatePost(post),
    ngoId: post.providerType === "ngo" ? ngoId : null,
  })));
});

router.patch("/posts/:id", requireAuth, async (req, res) => {
  const params = GetPostParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    logger.warn({ err: params.error, path: req.originalUrl }, "Invalid update-post params");
    return void res.status(400).json({ error: "Invalid post ID" });
  }

  const body = UpdatePostBody.safeParse(req.body);
  if (!body.success) {
    logger.warn({ err: body.error, path: req.originalUrl }, "Update post validation failed");
    return void res.status(400).json({ error: "Validation failed" });
  }

  const { title, description, status } = body.data;

  // Single atomic UPDATE: ownership check is part of the WHERE clause,
  // eliminating the SELECT → UPDATE race condition (TOCTOU).
  const [updatedPost] = await db
    .update(postsTable)
    .set({
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(postsTable.id, params.data.id), eq(postsTable.userId, req.user!.id)))
    .returning();

  if (!updatedPost) {
    // Could not find a post with this id owned by this user.
    return void res.status(404).json({ error: "Post not found or forbidden" });
  }

  res.json(toPrivatePost(updatedPost));
});

router.delete("/posts/:id", requireAuth, async (req, res) => {
  const params = GetPostParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    logger.warn({ err: params.error, path: req.originalUrl }, "Invalid delete-post params");
    return void res.status(400).json({ error: "Invalid post ID" });
  }

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
    logger.warn({ err: params.error, path: req.originalUrl }, "Invalid get-post params");
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }

  const [row] = await db
    .select({
      post: postsTable,
      ngoId: ngosTable.id,
    })
    .from(postsTable)
    .leftJoin(ngosTable, eq(postsTable.userId, ngosTable.userId))
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
