import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, dateTime } from "./DataTable";
import { Badge, PostActions } from "./Actions";
import type { AdminPost } from "./types";

const filters = {
  All: () => true,
  Reported: (p: AdminPost) => p.reportCount > 0,
  Active: (p: AdminPost) => p.status === "active",
  Hidden: (p: AdminPost) => p.status === "hidden",
  Pending: (p: AdminPost) => p.status === "pending",
  Closed: (p: AdminPost) =>
    p.status === "resolved" || p.status === "expired" || p.status === "removed",
} as const;
type Filter = keyof typeof filters;

export function PostsPanel({
  posts,
  onUpdate,
}: {
  posts: AdminPost[];
  onUpdate: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const rows = posts.filter(filters[filter]);
  return (
    <>
      <div aria-label="Post filters" className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(filters) as Filter[]).map((f) => (
          <Button
            size="sm"
            variant={f === filter ? "default" : "outline"}
            aria-pressed={f === filter}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>
      <DataTable
        rows={rows}
        empty="No posts match this filter."
        columns={[
          [
            "Post title",
            (p) => (
              <>
                <strong dir="auto">{p.title}</strong>
                <p className="text-xs text-slate-500">
                  {p.postType} · {p.category} · {p.governorate}
                </p>
              </>
            ),
          ],
          ["Status", (p) => <Badge status={p.status} />],
          ["Reports", (p) => p.reportCount],
          ["Created", (p) => dateTime(p.createdAt)],
          ["Expires", (p) => dateTime(p.expiresAt)],
          [
            "Next action",
            (p) => <PostActions post={p} onUpdate={() => void onUpdate()} />,
          ],
        ]}
      />
    </>
  );
}
