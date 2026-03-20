import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { postsTable } from "@workspace/db/schema";
import { and, eq, gt, or, isNull } from "drizzle-orm";
import {
  ListPostsQueryParams,
  CreatePostBody,
  GetPostParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * Build a safe public post object — NEVER exposes private coordinates or address.
 */
function toPublicPost(post: typeof postsTable.$inferSelect) {
  return {
    id: post.id,
    postType: post.postType,
    title: post.title,
    category: post.category,
    description: post.description,
    urgency: post.urgency ?? null,
    governorate: post.governorate,
    district: post.district ?? null,
    // publicLat/publicLng are the safe fuzzed coordinates — private ones are NEVER returned
    publicLat: post.publicLat ?? null,
    publicLng: post.publicLng ?? null,
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
    // privateLat, privateLng, exactAddressPrivate — NEVER included
  };
}

/** Fuzz a coordinate to ~district level (±0.05 degrees ≈ 5km) */
function fuzzCoordinate(coord: number): number {
  const jitter = (Math.random() - 0.5) * 0.1;
  return Math.round((coord + jitter) * 10000) / 10000;
}

/** District-level approximate centers for Lebanese governorates */
const GOVERNORATE_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Beirut": { lat: 33.8938, lng: 35.5018 },
  "Mount Lebanon": { lat: 33.8100, lng: 35.6000 },
  "North Lebanon": { lat: 34.4333, lng: 35.8333 },
  "South Lebanon": { lat: 33.2717, lng: 35.2033 },
  "Nabatieh": { lat: 33.3772, lng: 35.4840 },
  "Bekaa": { lat: 33.8500, lng: 35.9017 },
  "Akkar": { lat: 34.5581, lng: 36.0808 },
  "Baalbek-Hermel": { lat: 34.0049, lng: 36.2098 },
};

function getPublicCoordinates(
  postType: string,
  governorate: string,
  providedLat?: number | null,
  providedLng?: number | null,
) {
  if (postType === "need") {
    // For needs: always use fuzzed district-center coordinates, never exact
    const center = GOVERNORATE_CENTERS[governorate] ?? { lat: 33.8547, lng: 35.8623 };
    return { publicLat: fuzzCoordinate(center.lat), publicLng: fuzzCoordinate(center.lng) };
  }
  // For offers: use provided coordinates if available, else governorate center
  if (providedLat && providedLng) {
    return { publicLat: providedLat, publicLng: providedLng };
  }
  const center = GOVERNORATE_CENTERS[governorate] ?? { lat: 33.8547, lng: 35.8623 };
  return { publicLat: center.lat, publicLng: center.lng };
}

router.get("/posts", async (req, res) => {
  const query = ListPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters", details: String(query.error) });
    return;
  }

  const { postType, category, governorate, district, urgency, activeOnly, verifiedNgoOnly } = query.data;

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

  const posts = await db
    .select()
    .from(postsTable)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(postsTable.createdAt);

  res.json(posts.map(toPublicPost));
});

router.post("/posts", async (req, res) => {
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
    expiresInDays,
  } = body.data;

  const { publicLat, publicLng } = getPublicCoordinates(postType, governorate);

  // Compute expiry: use caller-supplied duration (capped 1–90 days) or default 30 days
  const daysUntilExpiry = expiresInDays && expiresInDays > 0 ? Math.min(expiresInDays, 90) : 30;
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
      privateLat: null,
      privateLng: null,
      exactAddressPrivate: exactAddressPrivate ?? null,
      providerType: providerType ?? null,
      contactMethod: contactMethod ?? null,
      contactInfo: contactInfo ?? null,
      // New posts are immediately active so they appear on the map.
      // Pending status is reserved for admin-reviewed content only.
      status: "active",
      expiresAt,
      lastConfirmedAt: new Date(),
    })
    .returning();

  res.status(201).json(toPublicPost(post));
});

router.get("/posts/:id", async (req, res) => {
  const params = GetPostParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, params.data.id))
    .limit(1);

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(toPublicPost(post));
});

export default router;
