/**
 * Admin/moderation routes.
 * Requires an authenticated user with the 'admin' role.
 * Exposes full post list (with exactAddressPrivate for moderation context)
 * but NEVER exposes privateLat or privateLng.
 */
import { Router, type IRouter } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { db } from "@workspace/db";
import { postsTable, reportsTable, ngosTable, adminActionsTable, usersTable } from "@workspace/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabase-admin";

const router: IRouter = Router();

// Protect all /admin routes
router.use("/admin", requireAuth, requireAdmin);

type PostStatus = "pending" | "active" | "hidden" | "resolved" | "expired" | "removed";
type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

const VALID_POST_STATUSES: PostStatus[] = ["pending", "active", "hidden", "resolved", "expired", "removed"];
const VALID_REPORT_STATUSES: ReportStatus[] = ["pending", "reviewed", "dismissed", "actioned"];

function isPostStatus(v: unknown): v is PostStatus {
  return typeof v === "string" && (VALID_POST_STATUSES as string[]).includes(v);
}

function isReportStatus(v: unknown): v is ReportStatus {
  return typeof v === "string" && (VALID_REPORT_STATUSES as string[]).includes(v);
}

// Admin post view — adds exactAddressPrivate for moderation context
// privateLat / privateLng are NEVER exposed
function toAdminPost(post: typeof postsTable.$inferSelect) {
  return {
    id: post.id,
    postType: post.postType,
    title: post.title,
    category: post.category,
    description: post.description,
    urgency: post.urgency ?? null,
    governorate: post.governorate,
    district: post.district ?? null,
    publicLat: post.publicLat ?? null,
    publicLng: post.publicLng ?? null,
    exactAddressPrivate: post.exactAddressPrivate ?? null,
    providerType: post.providerType ?? null,
    contactMethod: post.contactMethod ?? null,
    contactInfo: post.contactInfo ?? null,
    status: post.status,
    reportCount: post.reportCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    expiresAt: post.expiresAt ?? null,
    lastConfirmedAt: post.lastConfirmedAt ?? null,
    // privateLat, privateLng — NEVER included
  };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (_req, res) => {
  try {
    const postRows = await db.select({ status: postsTable.status }).from(postsTable);
    const reportRows = await db.select({ status: reportsTable.status }).from(reportsTable);
    const ngoRows = await db.select({ verifiedAt: ngosTable.verifiedAt }).from(ngosTable);

    const cnt = <T extends { status: string }>(rows: T[], val: string) =>
      rows.filter((r) => r.status === val).length;

    res.json({
      posts: {
        total: postRows.length,
        active: cnt(postRows, "active"),
        hidden: cnt(postRows, "hidden"),
        resolved: cnt(postRows, "resolved"),
        expired: cnt(postRows, "expired"),
        pending: cnt(postRows, "pending"),
        removed: cnt(postRows, "removed"),
      },
      reports: {
        total: reportRows.length,
        open: cnt(reportRows, "pending"),
        reviewed: cnt(reportRows, "reviewed"),
        dismissed: cnt(reportRows, "dismissed"),
        actioned: cnt(reportRows, "actioned"),
      },
      ngos: {
        total: ngoRows.length,
        verified: ngoRows.filter((n) => n.verifiedAt !== null).length,
        unverified: ngoRows.filter((n) => n.verifiedAt === null).length,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ── Posts ──────────────────────────────────────────────────────────────────────

router.get("/admin/posts", async (_req, res) => {
  try {
    const posts = await db.select().from(postsTable).orderBy(desc(postsTable.createdAt));
    res.json(posts.map(toAdminPost));
  } catch (err) {
    logger.error({ err }, "Failed to fetch posts");
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.patch("/admin/posts/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }

  const { status, note } = req.body ?? {};
  if (!isPostStatus(status)) {
    res.status(400).json({ error: `status must be one of: ${VALID_POST_STATUSES.join(", ")}` });
    return;
  }

  const [post] = await db
    .update(postsTable)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(postsTable.id, id))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  await db.insert(adminActionsTable).values({
    adminId: req.user!.id,
    targetType: "post",
    targetId: id,
    action: `status:${status}`,
    note: typeof note === "string" ? note : null,
  });

  res.json(toAdminPost(post));
});

// ── Reports ────────────────────────────────────────────────────────────────────

router.get("/admin/reports", async (_req, res) => {
  try {
    const rows = await db
      .select({
        report: reportsTable,
        postTitle: postsTable.title,
        postStatus: postsTable.status,
      })
      .from(reportsTable)
      .leftJoin(postsTable, eq(reportsTable.postId, postsTable.id))
      .orderBy(desc(reportsTable.reportedAt));

    res.json(
      rows.map(({ report, postTitle, postStatus }) => ({
        ...report,
        postTitle: postTitle ?? "(deleted)",
        postStatus: postStatus ?? "(unknown)",
      }))
    );
  } catch (err) {
    logger.error({ err }, "Failed to fetch reports");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.patch("/admin/reports/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid report ID" });
    return;
  }

  const { status } = req.body ?? {};
  if (!isReportStatus(status)) {
    res.status(400).json({ error: `status must be one of: ${VALID_REPORT_STATUSES.join(", ")}` });
    return;
  }

  const resolvedAt =
    status === "dismissed" || status === "actioned" ? new Date() : null;

  const [report] = await db
    .update(reportsTable)
    .set({ status: status as any, resolvedAt })
    .where(eq(reportsTable.id, id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(report);
});

// ── Users ───────────────────────────────────────────────────────────────────────

router.get("/admin/users", async (_req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json(users);
  } catch (err) {
    logger.error({ err }, "Failed to fetch users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.delete("/admin/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid User ID" });
    return;
  }
  try {
    const [user] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Attempt to delete from Supabase Auth if a UID is present and the admin client is configured
    const supabaseUid = (user as { supabaseUid?: string | null }).supabaseUid;
    if (supabaseUid && supabaseAdmin) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(supabaseUid);
      if (authError) {
        logger.error({ err: authError, supabaseUid }, "Failed to delete user from Supabase Auth");
      }
    }

    res.json(user);
  } catch (err: any) {
    logger.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ── NGOs ───────────────────────────────────────────────────────────────────────

router.get("/admin/ngos", async (_req, res) => {
  try {
    const ngos = await db.select().from(ngosTable).orderBy(desc(ngosTable.createdAt));
    res.json(ngos);
  } catch (err) {
    logger.error({ err }, "Failed to fetch NGOs");
    res.status(500).json({ error: "Failed to fetch NGOs" });
  }
});

router.post("/admin/ngos", async (req, res) => {
  const { name, description, governorate, district, lat, lng, phone, website, status, verified } = req.body ?? {};

  if (!name || typeof name !== "string" || name.length < 2) {
    res.status(400).json({ error: "name is required (min 2 chars)" });
    return;
  }
  if (!description || typeof description !== "string" || description.length < 10) {
    res.status(400).json({ error: "description is required (min 10 chars)" });
    return;
  }
  if (!governorate || typeof governorate !== "string") {
    res.status(400).json({ error: "governorate is required" });
    return;
  }

  const [ngo] = await db
    .insert(ngosTable)
    .values({
      name: String(name),
      description: String(description),
      governorate: String(governorate),
      district: district ? String(district) : null,
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      phone: phone ? String(phone) : null,
      website: website ? String(website) : null,
      status: status ? String(status) : "active",
      verifiedAt: verified ? new Date() : null,
    })
    .returning();

  res.status(201).json(ngo);
});

router.patch("/admin/ngos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid NGO ID" });
    return;
  }

  const { name, description, governorate, district, lat, lng, phone, website, status } = req.body ?? {};
  const updates: Record<string, unknown> = {};

  if (name != null) updates.name = String(name);
  if (description != null) updates.description = String(description);
  if (governorate != null) updates.governorate = String(governorate);
  if (district != null) updates.district = String(district);
  if (lat != null) updates.lat = Number(lat);
  if (lng != null) updates.lng = Number(lng);
  if (phone != null) updates.phone = String(phone);
  if (website != null) updates.website = String(website);
  if (status != null) updates.status = String(status);

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields provided to update" });
    return;
  }

  const [ngo] = await db
    .update(ngosTable)
    .set(updates as any)
    .where(eq(ngosTable.id, id))
    .returning();

  if (!ngo) {
    res.status(404).json({ error: "NGO not found" });
    return;
  }

  res.json(ngo);
});

router.delete("/admin/ngos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid NGO ID" });
    return;
  }
  try {
    const [ngo] = await db
      .delete(ngosTable)
      .where(eq(ngosTable.id, id))
      .returning();

    if (!ngo) {
      res.status(404).json({ error: "NGO not found" });
      return;
    }
    res.json(ngo);
  } catch (err: any) {
    logger.error({ err }, "Failed to delete NGO");
    res.status(500).json({ error: "Failed to delete NGO" });
  }
});

router.patch("/admin/ngos/:id/verify", async (req, res) => {
  const id = Number(req.params.id);
  const [ngo] = await db
    .update(ngosTable)
    .set({ verifiedAt: new Date() })
    .where(eq(ngosTable.id, id))
    .returning();

  if (!ngo) {
    res.status(404).json({ error: "NGO not found" });
    return;
  }

  if (ngo.userId) {
    await db
      .update(postsTable)
      .set({ verifiedBadgeType: "ngo" })
      .where(and(eq(postsTable.userId, ngo.userId), eq(postsTable.providerType, "ngo")));
  }

  res.json(ngo);
});

router.delete("/admin/ngos/:id/verify", async (req, res) => {
  const id = Number(req.params.id);
  const [ngo] = await db
    .update(ngosTable)
    .set({ verifiedAt: null })
    .where(eq(ngosTable.id, id))
    .returning();

  if (!ngo) {
    res.status(404).json({ error: "NGO not found" });
    return;
  }

  if (ngo.userId) {
    await db
      .update(postsTable)
      .set({ verifiedBadgeType: null })
      .where(and(eq(postsTable.userId, ngo.userId), eq(postsTable.providerType, "ngo")));
  }

  res.json(ngo);
});

// ── Stale post cleanup ─────────────────────────────────────────────────────────

router.post("/admin/cleanup", async (_req, res) => {
  try {
    const now = new Date();
    const result = await db
      .update(postsTable)
      .set({ status: "expired" as any, updatedAt: now })
      .where(
        and(
          eq(postsTable.status, "active"),
          sql`${postsTable.expiresAt} IS NOT NULL AND ${postsTable.expiresAt} <= ${now}`
        )
      )
      .returning({ id: postsTable.id });

    res.json({
      message: `Marked ${result.length} post(s) as expired`,
      expiredCount: result.length,
      expiredIds: result.map((r) => r.id),
    });
  } catch (err) {
    logger.error({ err }, "Cleanup failed");
    res.status(500).json({ error: "Cleanup failed" });
  }
});

export default router;
