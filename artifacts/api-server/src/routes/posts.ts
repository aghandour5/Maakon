import { Router, type IRouter } from "express";
import { rateLimit as expressRateLimit } from "express-rate-limit";
import { optionalAuth, requireAuth } from "../middlewares/auth";
import { rateLimit } from "../middlewares/rateLimit";
import { db } from "@workspace/db";
import { contactAccessLogTable, postsTable, ngosTable, type Post } from "@workspace/db/schema";
import { sql, notInArray, ne, and, eq, gt, inArray, isNotNull, isNull, or, asc, desc } from "drizzle-orm";
import {
  validPublicContact,
  AccessPostContactParams,
  ListPostsQueryParams,
  CreatePostBody,
  GetPostParams,
  UpdatePostBody,
} from "@workspace/api-zod";
import {
  isValidGovernorate,
  isValidLocation,
} from "@workspace/locations";
import { getPublicCoordinates } from "../lib/post-location";
import { canPublishOffer, OFFER_REFERRAL_REQUIRED } from "../lib/offer-policy";
import { isVulnerableNeedPost, toPrivatePost, toPublicPost } from "../lib/post-serializers";
import { logger } from "../lib/logger";

import { nextPostVersion, reviewStates } from "../lib/post-review";

const DEFAULT_EXPIRY_DAYS = 30;
const MAX_EXPIRY_DAYS = 90;

const router: IRouter = Router();
const createPostRateLimiter = rateLimit(
  15 * 60 * 1000,
  20,
  "Too many post submissions, please try again after 15 minutes.",
);

const contactAccessRateLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user!.id),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many contact views. Try again in 15 minutes." },
});

function isPubliclyVisiblePost(post: Pick<Post, "status" | "expiresAt">): boolean {
  if (post.status !== "active") {
    return false;
  }

  return !post.expiresAt || post.expiresAt.getTime() > Date.now();
}

router.get("/posts", optionalAuth, async (req, res) => {
  // Boolean coercion treats the query string "false" as true.
  const query = ListPostsQueryParams.safeParse({
    ...req.query,
    activeOnly: req.query.activeOnly !== "false",
  });
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
  } else {
    filters.push(inArray(postsTable.status, ["active", "resolved", "expired"]));
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
    ...toPublicPost(post, req.user?.id),
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

  if (postType === "offer" && !canPublishOffer(req.user)) {
    return void res.status(403).json(OFFER_REFERRAL_REQUIRED);
  }

  const isNgoNeed = postType === "need" && providerType === "ngo";
  if (isNgoNeed && !validPublicContact(body.data.publicContactMethod, body.data.publicContactInfo)) {
    return void res.status(400).json({ error: "Invalid public contact" });
  }

  const storePrivateLocation = !isVulnerableNeedPost(postType, providerType);
  const storedPrivateLat = storePrivateLocation ? providedLat ?? null : null;
  const storedPrivateLng = storePrivateLocation ? providedLng ?? null : null;

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

      if (!ngo && postType === "offer") {
        // Auto-create unverified NGO so it appears in the admin console.
        [ngo] = await tx
          .insert(ngosTable)
          .values({
            userId: req.user!.id,
            name: title,
            description,
            governorate,
            district: district ?? null,
            lat: storedPrivateLat,
            lng: storedPrivateLng,
            phone: contactInfo ?? null,
            status: "active",
          })
          .returning();
      }

      ngoId = ngo?.id ?? null;
      if (ngo?.verifiedAt) {
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
        privateLat: storedPrivateLat,
        privateLng: storedPrivateLng,
        exactAddressPrivate: exactAddressPrivate ?? null,
        providerType: providerType ?? null,
        verifiedBadgeType,
        contactMethod: contactMethod ?? null,
        contactInfo: contactInfo ?? null,
        publicContactMethod: isNgoNeed ? body.data.publicContactMethod : null,
        publicContactInfo: isNgoNeed ? body.data.publicContactInfo?.trim() : null,
        status: postType === "need" ? "pending" : "active",
        userId: req.user!.id,
        expiresAt,
        lastConfirmedAt: new Date(),
      })
      .returning();

    return { post, ngoId };
  });

  res.status(201).json({
    ...toPublicPost(post, req.user!.id),
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
    ...toPrivatePost(post, req.user!.id),
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
  const ownedPost = and(eq(postsTable.id, params.data.id), eq(postsTable.userId, req.user!.id));
  const needsOfferCheck = status === "active" && !canPublishOffer(req.user);

  const editsText = title !== undefined || description !== undefined;
  const changed = or(
    title !== undefined ? ne(postsTable.title, title) : undefined,
    description !== undefined ? ne(postsTable.description, description) : undefined,
  );
  const allowed = and(
    ownedPost,
    needsOfferCheck ? eq(postsTable.postType, "need") : undefined,
    status ? notInArray(postsTable.status, [...reviewStates]) : undefined,
    editsText ? or(eq(postsTable.postType, "offer"), notInArray(postsTable.status, ["resolved", "expired", "removed", "draft"])) : undefined,
  );

  // Single atomic UPDATE: ownership check is part of the WHERE clause,
  // eliminating the SELECT → UPDATE race condition (TOCTOU).
  const [updatedPost] = await db
    .update(postsTable)
    .set({
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      status: changed ? sql`case
        when ${postsTable.postType} = 'need' and ${postsTable.status} in ('active', 'hidden')
          and (${changed}) then 'pending'::post_status
        else ${status ? sql`${status}::post_status` : postsTable.status} end` : status,
      updatedAt: nextPostVersion,
    })
    .where(allowed)
    .returning();

  if (!updatedPost) {
    if (needsOfferCheck) {
      const [offer] = await db.select({ id: postsTable.id }).from(postsTable)
        .where(and(ownedPost, eq(postsTable.postType, "offer")));
      if (offer) return void res.status(403).json(OFFER_REFERRAL_REQUIRED);
    }
    const [existing] = await db.select({ id: postsTable.id }).from(postsTable).where(ownedPost);
    if (existing) return void res.status(409).json({ error: "This change is unavailable for the current status" });
    return void res.status(404).json({ error: "Post not found or forbidden" });
  }

  res.json(toPrivatePost(updatedPost, req.user!.id));
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

router.get("/posts/:id", optionalAuth, async (req, res) => {
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
    ...toPublicPost(row.post, req.user?.id),
    ngoId: row.post.providerType === "ngo" ? row.ngoId : null,
  });
});

router.post(
  "/posts/:id/contact-access",
  (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  requireAuth,
  contactAccessRateLimiter,
  async (req, res) => {
    const user = req.user!;
    const forbidden = { error: "Only verified organizations can view contact details." };
    if (user.accountType !== "ngo") return void res.status(403).json(forbidden);

    const params = AccessPostContactParams.safeParse(req.params);
    if (!params.success || !Number.isInteger(params.data.id)) {
      return void res.status(400).json({ error: "Invalid post ID" });
    }

    const result = await db.transaction(async (tx) => {
      // Keep authorization and request visibility stable through the audit write.
      const [ngo] = await tx.select({ id: ngosTable.id }).from(ngosTable)
        .where(and(
          eq(ngosTable.userId, user.id),
          eq(ngosTable.status, "active"),
          isNotNull(ngosTable.verifiedAt),
        ))
        .orderBy(asc(ngosTable.id))
        .limit(1)
        .for("share");
      if (!ngo) return { status: 403, body: forbidden };

      const [post] = await tx.select({
        id: postsTable.id,
        status: postsTable.status,
        expiresAt: postsTable.expiresAt,
        postType: postsTable.postType,
        providerType: postsTable.providerType,
        contactMethod: postsTable.contactMethod,
        contactInfo: postsTable.contactInfo,
      }).from(postsTable)
        .where(eq(postsTable.id, params.data.id))
        .for("share");
      if (!post || !isPubliclyVisiblePost(post) || !isVulnerableNeedPost(post.postType, post.providerType)) {
        return { status: 404, body: { error: "Post not found" } };
      }

      await tx.insert(contactAccessLogTable).values({
        viewerUserId: user.id,
        ngoId: ngo.id,
        postId: post.id,
      });
      return {
        status: 200,
        body: { postId: post.id, contactMethod: post.contactMethod, contactInfo: post.contactInfo },
      };
    });

    res.status(result.status).json(result.body);
  },
);

export default router;
