import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reportsTable, postsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { CreateReportBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/reports", async (req, res) => {
  const body = CreateReportBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Validation failed", details: String(body.error) });
    return;
  }

  const { postId, reason, details } = body.data;

  const post = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(eq(postsTable.id, postId))
    .limit(1);

  if (!post.length) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [report] = await db
    .insert(reportsTable)
    .values({ postId, reason, details: details ?? null })
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
