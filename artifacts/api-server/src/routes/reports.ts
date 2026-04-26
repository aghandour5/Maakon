import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { db } from "@workspace/db";
import { logger } from "../lib/logger";
import { reportsTable, postsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { CreateReportBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/reports", requireAuth, async (req, res) => {
  const body = CreateReportBody.safeParse(req.body);
  if (!body.success) {
    // SECURITY: Do not expose Zod error details to the client
    logger.error({ err: body.error }, "Validation failed for POST /reports");
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const { postId, reason, details } = body.data;

  const [post] = await db
    .select({
      id: postsTable.id,
      userId: postsTable.userId,
      status: postsTable.status,
      expiresAt: postsTable.expiresAt,
    })
    .from(postsTable)
    .where(eq(postsTable.id, postId))
    .limit(1);

  if (
    !post ||
    post.status !== "active" ||
    (post.expiresAt && post.expiresAt.getTime() <= Date.now())
  ) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  if (post.userId === req.user!.id) {
    res.status(400).json({ error: "You cannot report your own post" });
    return;
  }

  const normalizedDetails = details?.trim();

  const [report] = await db
    .insert(reportsTable)
    .values({ postId, reason, details: normalizedDetails || null })
    .returning();

  // Increment report count on the post
  await db
    .update(postsTable)
    .set({ reportCount: sql`${postsTable.reportCount} + 1` })
    .where(eq(postsTable.id, postId));

  res.status(201).json({
    id: report.id,
    postId: report.postId,
    reason: report.reason,
    reportedAt: report.reportedAt,
    status: report.status,
  });
});

export default router;
