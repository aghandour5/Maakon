import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, dateTime } from "./DataTable";
import { Badge, PostActions, ReviewActions } from "./Actions";
import type { AdminPost } from "./types";

const filters = {
  All: () => true,
  Reported: (p: AdminPost) => p.reportCount > 0,
  Active: (p: AdminPost) => p.status === "active",
  Hidden: (p: AdminPost) => p.status === "hidden",
  Frozen: (p: AdminPost) => p.status === "frozen",
  "Pending review": (p: AdminPost) => p.status === "pending",
  Closed: (p: AdminPost) =>
    p.status === "resolved" || p.status === "expired" || p.status === "removed",
} as const;
type Filter = keyof typeof filters;

const inReview = (p: AdminPost) => p.status === "pending" || p.status === "frozen";

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
                {inReview(p) && <div className="mt-2 max-w-prose space-y-1 text-sm">
                  <p dir="auto" className="whitespace-pre-wrap break-words">{p.description}</p>
                  <p>{[p.district, p.providerType ?? "individual", p.urgency].filter(Boolean).join(" · ")}</p>
                  {p.publicContactInfo && <p>Public {p.publicContactMethod}: <bdi>{p.publicContactInfo}</bdi></p>}
                </div>}
              </>
            ),
          ],
          ["Status", (p) => <Badge status={p.status === "pending" ? "pending review" : p.status} />],
          ["Reports", (p) => p.reportCount],
          ["Created", (p) => dateTime(p.createdAt)],
          ["Expires", (p) => inReview(p) ? `${p.durationDays} days after acceptance` : dateTime(p.expiresAt)],
          [
            "Next action",
            (p) => inReview(p) ? (p.postType === "need" && <ReviewActions key={p.updatedAt} post={p} onUpdate={onUpdate} />) : <PostActions post={p} onUpdate={() => void onUpdate()} />,
          ],
        ]}
      />
    </>
  );
}
