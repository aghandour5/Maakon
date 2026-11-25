import type { Tab, Stats } from "./types";
const names: Record<Tab, string> = {
  posts: "Posts",
  reports: "Reports",
  ngos: "NGOs",
  users: "Users",
};
export function AdminTabs({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav
      aria-label="Admin sections"
      className="flex max-w-full overflow-x-auto rounded-lg border bg-white p-1"
    >
      {(Object.keys(names) as Tab[]).map((t) => (
        <button
          key={t}
          aria-current={tab === t ? "page" : undefined}
          className={`rounded px-4 py-2 text-sm font-medium ${t === tab ? "bg-slate-800 text-white" : "hover:bg-slate-100"}`}
          onClick={() => onChange(t)}
        >
          {names[t]}
        </button>
      ))}
    </nav>
  );
}
export function StatsStrip({ stats }: { stats: Stats }) {
  return (
    <dl className="grid grid-cols-2 divide-x divide-slate-200 rounded-lg border bg-white sm:grid-cols-3 lg:grid-cols-5">
      {Object.entries({
        "Active posts": stats.posts.active,
        "Hidden posts": stats.posts.hidden,
        "Pending drafts": stats.posts.pending,
        "Open reports": stats.reports.open,
        "Verified NGOs": stats.ngos.verified,
      }).map(([label, value]) => (
        <div className="p-3" key={label}>
          <dt className="text-xs text-slate-600">{label}</dt>
          <dd className="text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
