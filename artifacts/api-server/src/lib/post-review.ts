import { postsTable, type Post } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

export const reviewStates = ["draft", "pending", "frozen"] as const;

export function isSubmittedNeed(post: Post) {
  return post.postType === "need" && post.userId !== null && post.draftToken === null && post.status !== "draft";
}

export function durationDays(post: Post) {
  const start = post.lastConfirmedAt ?? post.createdAt;
  if (!post.expiresAt) return 30;
  return Math.max(1, Math.min(90, Math.round((post.expiresAt.getTime() - start.getTime()) / 86400000)));
}

// Keep versions distinguishable in the millisecond timestamps sent to clients.
export const nextPostVersion = sql`greatest(clock_timestamp(), ${postsTable.updatedAt} + interval '1 millisecond')`;
