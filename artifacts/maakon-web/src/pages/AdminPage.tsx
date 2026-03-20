/**
 * AdminPage — dev-only internal moderation panel.
 * No authentication. Clearly marked as development-only.
 * English-only UI (internal tool).
 */
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw, CheckCircle2, EyeOff, RotateCcw, Clock, Trash2, Shield, ShieldOff, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────────

type PostStatus = "active" | "hidden" | "resolved" | "expired" | "pending" | "removed";
type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

interface AdminPost {
  id: number;
  postType: "need" | "offer";
  title: string;
  category: string;
  governorate: string;
  status: PostStatus;
  reportCount: number;
  expiresAt: string | null;
  createdAt: string;
}

interface AdminReport {
  id: number;
  postId: number;
  postTitle: string;
  postStatus: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reportedAt: string;
  resolvedAt: string | null;
}

interface AdminNgo {
  id: number;
  name: string;
  governorate: string;
  district: string | null;
  phone: string | null;
  website: string | null;
  verifiedAt: string | null;
  status: string;
}

interface Stats {
  posts: { total: number; active: number; hidden: number; resolved: number; expired: number; pending: number };
  reports: { total: number; open: number; reviewed: number; dismissed: number; actioned: number };
  ngos: { total: number; verified: number; unverified: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const API = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `expired ${Math.abs(diff)}d ago`;
  if (diff === 0) return "expires today";
  return `${diff}d`;
}

function timeAgo(dateStr: string): string {
  const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

// ── Status badge ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  hidden: "bg-orange-100 text-orange-800",
  resolved: "bg-blue-100 text-blue-800",
  expired: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-800",
  removed: "bg-red-100 text-red-800",
  reviewed: "bg-blue-100 text-blue-800",
  dismissed: "bg-gray-100 text-gray-600",
  actioned: "bg-emerald-100 text-emerald-800",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ── Action dropdown ────────────────────────────────────────────────────────────

function PostActions({ post, onUpdate }: { post: AdminPost; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const act = async (status: PostStatus) => {
    setOpen(false);
    setLoading(true);
    try {
      await apiFetch(`/admin/posts/${post.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note: `Set by admin panel` }),
      });
      onUpdate();
    } catch (e) {
      alert(`Failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const options: { label: string; status: PostStatus; icon: React.ReactNode }[] = (
    [
      { label: "Restore active", status: "active" as PostStatus, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
      { label: "Hide", status: "hidden" as PostStatus, icon: <EyeOff className="w-3.5 h-3.5" /> },
      { label: "Mark resolved", status: "resolved" as PostStatus, icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> },
      { label: "Mark expired", status: "expired" as PostStatus, icon: <Clock className="w-3.5 h-3.5" /> },
      { label: "Remove", status: "removed" as PostStatus, icon: <Trash2 className="w-3.5 h-3.5 text-red-500" /> },
    ] as { label: string; status: PostStatus; icon: React.ReactNode }[]
  ).filter((o) => o.status !== post.status);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-1 text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
        Action
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 bg-white border border-gray-200 rounded shadow-lg min-w-[160px]">
          {options.map((o) => (
            <button
              key={o.status}
              onClick={() => act(o.status)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 text-left"
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Report actions ─────────────────────────────────────────────────────────────

function ReportActions({ report, onUpdate }: { report: AdminReport; onUpdate: () => void }) {
  const [loading, setLoading] = useState<ReportStatus | null>(null);

  const act = async (status: ReportStatus) => {
    setLoading(status);
    try {
      await apiFetch(`/admin/reports/${report.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onUpdate();
    } catch (e) {
      alert(`Failed: ${e}`);
    } finally {
      setLoading(null);
    }
  };

  if (report.status !== "pending") return <Badge status={report.status} />;

  return (
    <div className="flex gap-1">
      <button
        onClick={() => act("reviewed")}
        disabled={!!loading}
        className="text-xs border border-blue-300 text-blue-700 rounded px-2 py-0.5 hover:bg-blue-50 disabled:opacity-50"
      >
        Review
      </button>
      <button
        onClick={() => act("actioned")}
        disabled={!!loading}
        className="text-xs border border-emerald-300 text-emerald-700 rounded px-2 py-0.5 hover:bg-emerald-50 disabled:opacity-50"
      >
        Action
      </button>
      <button
        onClick={() => act("dismissed")}
        disabled={!!loading}
        className="text-xs border border-gray-300 text-gray-600 rounded px-2 py-0.5 hover:bg-gray-50 disabled:opacity-50"
      >
        Dismiss
      </button>
    </div>
  );
}

// ── NGO actions ────────────────────────────────────────────────────────────────

function NgoActions({ ngo, onUpdate }: { ngo: AdminNgo; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);

  const toggleVerify = async () => {
    setLoading(true);
    try {
      const method = ngo.verifiedAt ? "DELETE" : "PATCH";
      await apiFetch(`/admin/ngos/${ngo.id}/verify`, { method });
      onUpdate();
    } catch (e) {
      alert(`Failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleVerify}
      disabled={loading}
      className={`flex items-center gap-1 text-xs border rounded px-2 py-0.5 disabled:opacity-50 ${
        ngo.verifiedAt
          ? "border-orange-300 text-orange-700 hover:bg-orange-50"
          : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : ngo.verifiedAt ? (
        <ShieldOff className="w-3 h-3" />
      ) : (
        <Shield className="w-3 h-3" />
      )}
      {ngo.verifiedAt ? "Unverify" : "Verify"}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<"posts" | "reports" | "ngos">("posts");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [ngos, setNgos] = useState<AdminNgo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const s = await apiFetch<Stats>("/admin/stats");
      setStats(s);
    } catch {}
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const p = await apiFetch<AdminPost[]>("/admin/posts");
      setPosts(p);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch<AdminReport[]>("/admin/reports");
      setReports(r);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNgos = useCallback(async () => {
    setLoading(true);
    try {
      const n = await apiFetch<AdminNgo[]>("/admin/ngos");
      setNgos(n);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    loadStats();
    if (tab === "posts") loadPosts();
    else if (tab === "reports") loadReports();
    else loadNgos();
  }, [tab, loadStats, loadPosts, loadReports, loadNgos]);

  useEffect(() => {
    refresh();
  }, [tab]);

  const runCleanup = async () => {
    try {
      const result = await apiFetch<{ message: string; expiredCount: number }>("/admin/cleanup", { method: "POST" });
      setCleanupResult(result.message);
      loadStats();
      if (tab === "posts") loadPosts();
    } catch (e) {
      setCleanupResult(`Error: ${e}`);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 font-mono">
      {/* Header */}
      <div className="bg-amber-50 border-b-2 border-amber-400 px-4 py-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-xs text-amber-800 font-semibold">
          MAAKON ADMIN — Development panel, no authentication. Do not expose in production.
        </span>
        <a href="/" className="ml-auto text-xs text-amber-700 underline hover:no-underline">← Back to app</a>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard label="Active posts" value={stats.posts.active} color="emerald" />
            <StatCard label="Hidden posts" value={stats.posts.hidden} color="orange" />
            <StatCard label="Open reports" value={stats.reports.open} color="yellow" />
            <StatCard label="Verified NGOs" value={stats.ngos.verified} note={`/ ${stats.ngos.total} total`} color="blue" />
          </div>
        )}

        {/* Cleanup button */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={runCleanup}
            className="text-xs gap-1"
          >
            <Clock className="w-3.5 h-3.5" />
            Run expiry cleanup
          </Button>
          <Button size="sm" variant="ghost" onClick={refresh} className="text-xs gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {cleanupResult && (
            <span className="text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1">
              {cleanupResult}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {(["posts", "reports", "ngos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-gray-800 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "posts" && stats && <span className="ml-1 text-xs text-gray-400">({stats.posts.total})</span>}
              {t === "reports" && stats && <span className="ml-1 text-xs text-gray-400">({stats.reports.total})</span>}
              {t === "ngos" && stats && <span className="ml-1 text-xs text-gray-400">({stats.ngos.total})</span>}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading...
          </div>
        )}

        {/* ── Posts table ──────────────────────────────────────────────────── */}
        {tab === "posts" && !loading && (
          <div className="bg-white border border-gray-200 rounded overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["ID", "Type", "Title", "Category", "Governorate", "Status", "Reports", "Expires", "Created", "Action"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className={`hover:bg-gray-50 ${post.status !== "active" ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2 text-gray-400">{post.id}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${post.postType === "need" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {post.postType}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[200px] truncate font-medium text-gray-800">{post.title}</td>
                    <td className="px-3 py-2 text-gray-500">{post.category}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{post.governorate}</td>
                    <td className="px-3 py-2"><Badge status={post.status} /></td>
                    <td className="px-3 py-2 text-center">
                      {post.reportCount > 0 ? (
                        <span className="bg-red-100 text-red-700 px-1.5 rounded font-semibold">{post.reportCount}</span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{daysUntil(post.expiresAt)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-400">{timeAgo(post.createdAt)}</td>
                    <td className="px-3 py-2">
                      <PostActions post={post} onUpdate={refresh} />
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">No posts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Reports table ─────────────────────────────────────────────────── */}
        {tab === "reports" && !loading && (
          <div className="bg-white border border-gray-200 rounded overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["ID", "Post", "Post status", "Reason", "Details", "Status", "Reported", "Action"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{report.id}</td>
                    <td className="px-3 py-2">
                      <span className="text-gray-700 font-medium">#{report.postId}</span>
                      <div className="text-gray-400 truncate max-w-[150px]">{report.postTitle}</div>
                    </td>
                    <td className="px-3 py-2"><Badge status={report.postStatus} /></td>
                    <td className="px-3 py-2 font-medium text-gray-700">{report.reason}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">{report.details ?? "—"}</td>
                    <td className="px-3 py-2"><Badge status={report.status} /></td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-400">{timeAgo(report.reportedAt)}</td>
                    <td className="px-3 py-2"><ReportActions report={report} onUpdate={refresh} /></td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No reports found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── NGOs table ────────────────────────────────────────────────────── */}
        {tab === "ngos" && !loading && (
          <div className="bg-white border border-gray-200 rounded overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["ID", "Name", "Governorate", "Phone", "Website", "Verified", "Status", "Action"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ngos.map((ngo) => (
                  <tr key={ngo.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{ngo.id}</td>
                    <td className="px-3 py-2 font-medium text-gray-800 max-w-[200px] truncate">{ngo.name}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{ngo.governorate}</td>
                    <td className="px-3 py-2 text-gray-500">{ngo.phone ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {ngo.website ? (
                        <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-[120px]">
                          {ngo.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {ngo.verifiedAt ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <Shield className="w-3 h-3" />
                          {new Date(ngo.verifiedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unverified</span>
                      )}
                    </td>
                    <td className="px-3 py-2"><Badge status={ngo.status} /></td>
                    <td className="px-3 py-2"><NgoActions ngo={ngo} onUpdate={refresh} /></td>
                  </tr>
                ))}
                {ngos.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No NGOs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, note, color }: { label: string; value: number; note?: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    red: "border-red-200 bg-red-50 text-red-800",
    gray: "border-gray-200 bg-gray-50 text-gray-600",
  };
  return (
    <div className={`border rounded p-3 ${colors[color] ?? colors.gray}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium">{label}</div>
      {note && <div className="text-xs opacity-70">{note}</div>}
    </div>
  );
}
