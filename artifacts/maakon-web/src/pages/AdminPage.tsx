import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw, CheckCircle2, EyeOff, Clock, Trash2, Shield, ShieldOff, Loader2, ChevronDown, Activity, ClipboardList, Building2, LayoutDashboard, Globe, Plus, Edit2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { NgoModal } from "@/components/admin/NgoModal";


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

export interface AdminUser {
  id: number;
  email: string | null;
  displayName: string | null;
  role: string;
  accountType: string;
  ngoVerificationStatus: string;
  createdAt: string;
}

export interface AdminNgo {
  id: number;
  name: string;
  description: string | null;
  governorate: string;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  verifiedAt: string | null;
  status: string;
  createdAt: string;
}

const VALID_POST_STATUSES: PostStatus[] = ["active", "hidden", "resolved", "expired", "pending", "removed"];
const VALID_REPORT_STATUSES: ReportStatus[] = ["pending", "reviewed", "dismissed", "actioned"];

function isPostStatus(v: unknown): v is PostStatus {
  return typeof v === "string" && (VALID_POST_STATUSES as string[]).includes(v);
}
function isReportStatus(v: unknown): v is ReportStatus {
  return typeof v === "string" && (VALID_REPORT_STATUSES as string[]).includes(v);
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
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData.error || `API error ${res.status}`);
    (err as any).status = res.status;
    (err as any).code = errorData.error;
    throw err;
  }
  
  return res.json();
}

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `Expired ${Math.abs(diff)}d ago`;
  if (diff === 0) return "Expires today";
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
  active: "bg-emerald-50 text-emerald-600 border-emerald-200",
  hidden: "bg-orange-50 text-orange-600 border-orange-200",
  resolved: "bg-blue-50 text-blue-600 border-blue-200",
  expired: "bg-slate-100 text-slate-500 border-slate-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  removed: "bg-red-50 text-red-600 border-red-200",
  reviewed: "bg-indigo-50 text-indigo-600 border-indigo-200",
  dismissed: "bg-slate-100 text-slate-500 border-slate-200",
  actioned: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Action dropdown ────────────────────────────────────────────────────────────

function PostActions({ post, onUpdate }: { post: AdminPost; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close on any outside click
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Close on scroll so menu doesn't float in wrong spot
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, left: rect.right });
    }
    setOpen((v) => !v);
  };

  const act = async (status: PostStatus) => {
    setOpen(false);
    setLoading(true);
    try {
      await apiFetch(`/admin/posts/${post.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note: `Set by admin panel` }),
      });
      toast({ title: "Success", description: `Post marked as ${status}` });
      onUpdate();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: `Failed: ${e instanceof Error ? e.message : e}` });
    } finally {
      setLoading(false);
    }
  };

  const options: { label: string; status: PostStatus; icon: React.ReactNode }[] = (
    [
      { label: "Restore active", status: "active" as PostStatus, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
      { label: "Hide", status: "hidden" as PostStatus, icon: <EyeOff className="w-3.5 h-3.5" /> },
      { label: "Mark resolved", status: "resolved" as PostStatus, icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> },
      { label: "Mark expired", status: "expired" as PostStatus, icon: <Clock className="w-3.5 h-3.5" /> },
      { label: "Remove", status: "removed" as PostStatus, icon: <Trash2 className="w-3.5 h-3.5 text-red-500" /> },
    ] as { label: string; status: PostStatus; icon: React.ReactNode }[]
  ).filter((o) => o.status !== post.status);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 text-slate-600"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Manage
      </button>

      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, transform: "translateX(-100%)" }}
          className="z-[9999]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.12 }}
            className="bg-white border border-slate-200 rounded-xl shadow-xl min-w-[180px] overflow-hidden ring-1 ring-black/5"
          >
            {options.map((o) => (
              <button
                key={o.status}
                onClick={() => act(o.status)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium hover:bg-slate-50 text-slate-700 transition-colors text-left"
              >
                {o.icon}
                {o.label}
              </button>
            ))}
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── Report actions ─────────────────────────────────────────────────────────────

function ReportActions({ report, onUpdate }: { report: AdminReport; onUpdate: () => void }) {
  const [loading, setLoading] = useState<ReportStatus | null>(null);
  const { toast } = useToast();

  const act = async (status: ReportStatus) => {
    setLoading(status);
    try {
      await apiFetch(`/admin/reports/${report.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast({ title: "Success", description: `Report marked as ${status}` });
      onUpdate();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: `Failed: ${e instanceof Error ? e.message : e}` });
    } finally {
      setLoading(null);
    }
  };

  if (report.status !== "pending") return <Badge status={report.status} />;

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => act("reviewed")}
        disabled={!!loading}
        className="text-xs font-medium border border-indigo-200 text-indigo-600 rounded-lg px-2.5 py-1 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
      >
        Review
      </button>
      <button
        onClick={() => act("actioned")}
        disabled={!!loading}
        className="text-xs font-medium border border-emerald-200 text-emerald-600 rounded-lg px-2.5 py-1 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
      >
        Action
      </button>
      <button
        onClick={() => act("dismissed")}
        disabled={!!loading}
        className="text-xs font-medium border border-slate-200 text-slate-600 rounded-lg px-2.5 py-1 hover:bg-slate-50 disabled:opacity-50 transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}

// ── NGO actions ────────────────────────────────────────────────────────────────

function NgoActions({ ngo, onUpdate, onEdit }: { ngo: AdminNgo; onUpdate: () => void; onEdit: (ngo: AdminNgo) => void }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleVerify = async () => {
    setLoading(true);
    try {
      const method = ngo.verifiedAt ? "DELETE" : "PATCH";
      await apiFetch(`/admin/ngos/${ngo.id}/verify`, { method });
      toast({ title: "Success", description: `NGO verification status updated` });
      onUpdate();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: `Failed: ${e instanceof Error ? e.message : e}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={async () => {
          if (!confirm("Are you sure you want to delete this NGO? This action cannot be undone.")) return;
          setLoading(true);
          try {
            await apiFetch(`/admin/ngos/${ngo.id}`, { method: "DELETE" });
            toast({ title: "Success", description: "NGO deleted successfully" });
            onUpdate();
          } catch (e) {
            toast({ variant: "destructive", title: "Error", description: `Failed to delete: ${e instanceof Error ? e.message : e}` });
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 min-w-[70px] text-xs font-medium border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-all disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
      <button
        onClick={() => onEdit(ngo)}
        className="flex items-center justify-center gap-1.5 min-w-[70px] text-xs font-medium border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-all"
      >
        <Edit2 className="w-3.5 h-3.5" />
        Edit
      </button>
      <button
        onClick={toggleVerify}
        disabled={loading}
        className={`flex items-center justify-center gap-1.5 min-w-[100px] text-xs font-medium border rounded-lg px-3 py-1.5 disabled:opacity-50 transition-all ${
          ngo.verifiedAt
            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : ngo.verifiedAt ? (
          <ShieldOff className="w-3.5 h-3.5" />
        ) : (
          <Shield className="w-3.5 h-3.5" />
        )}
        {ngo.verifiedAt ? "Unverify" : "Verify Logo"}
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<"posts" | "reports" | "ngos" | "users">("posts");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [ngos, setNgos] = useState<AdminNgo[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [ngoModalOpen, setNgoModalOpen] = useState(false);
  const [editingNgo, setEditingNgo] = useState<AdminNgo | null>(null);
  const { user, isAuthenticated, isLoading: authLoading, mfaStatus, setMfaStatus, openAuthModal } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar");
  };

  const handleMfaRequired = useCallback(() => {
    if (!user) return;
    // Step-up transition: Determine step based on user object if we had it, 
    // or just assume mfa_challenge if enabled.
    // Actually, we'll let the modal handle the detail.
    setMfaStatus(user.mfaEnabled ? "mfa_challenge" : "mfa_setup_required");
    openAuthModal();
  }, [user, setMfaStatus, openAuthModal]);

  const loadStats = useCallback(async () => {
    try {
      const s = await apiFetch<Stats>("/admin/stats");
      setStats(s);
      setError(null);
    } catch (e: any) {
      if (e.code === "MFA_REQUIRED") handleMfaRequired();
      // Stats fail silently for others
    }
  }, [handleMfaRequired]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await apiFetch<AdminPost[]>("/admin/posts");
      setPosts(p);
    } catch (e: any) {
      if (e.code === "MFA_REQUIRED") handleMfaRequired();
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [handleMfaRequired]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch<AdminReport[]>("/admin/reports");
      setReports(r);
    } catch (e: any) {
      if (e.code === "MFA_REQUIRED") handleMfaRequired();
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [handleMfaRequired]);

  const loadNgos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const n = await apiFetch<AdminNgo[]>("/admin/ngos");
      setNgos(n);
    } catch (e: any) {
      if (e.code === "MFA_REQUIRED") handleMfaRequired();
      setError(e instanceof Error ? e.message : "Failed to load NGOs");
    } finally {
      setLoading(false);
    }
  }, [handleMfaRequired]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await apiFetch<AdminUser[]>("/admin/users");
      setUsersList(u);
    } catch (e: any) {
      if (e.code === "MFA_REQUIRED") handleMfaRequired();
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [handleMfaRequired]);

  const refresh = useCallback((showToastMessage = false) => {
    loadStats();
    if (tab === "posts") loadPosts();
    else if (tab === "reports") loadReports();
    else if (tab === "ngos") loadNgos();
    else loadUsers();
    if (showToastMessage === true) {
      toast({ title: "Refreshed", description: "Latest data loaded." });
    }
  }, [tab, loadStats, loadPosts, loadReports, loadNgos, loadUsers, toast]);

  useEffect(() => {
    if (isAuthenticated && !mfaStatus) {
      setError(null);
      refresh(false);
    }
  }, [tab, isAuthenticated, mfaStatus, refresh]);

  const handleSaveNgo = async (data: any) => {
    try {
      if (editingNgo) {
        await apiFetch(`/admin/ngos/${editingNgo.id}`, { method: "PATCH", body: JSON.stringify(data) });
        toast({ title: "Success", description: "NGO updated successfully" });
      } else {
        await apiFetch(`/admin/ngos`, { method: "POST", body: JSON.stringify(data) });
        toast({ title: "Success", description: "NGO created successfully" });
      }
      refresh(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: `Failed to save NGO: ${e instanceof Error ? e.message : e}` });
      throw e;
    }
  };

  const runCleanup = async () => {
    try {
      const result = await apiFetch<{ message: string; expiredCount: number }>("/admin/cleanup", { method: "POST" });
      setCleanupResult(result.message);
      toast({ title: "Cleanup Complete", description: result.message });
      setTimeout(() => setCleanupResult(null), 4000);
      loadStats();
      if (tab === "posts") loadPosts();
    } catch (e) {
      setCleanupResult(`Error: ${e}`);
      toast({ variant: "destructive", title: "Error", description: `Cleanup failed: ${e}` });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin" || (error?.includes("403") && error?.includes("MFA_REQUIRED"))) {
    const isMfaError = error?.includes("MFA_REQUIRED");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-md w-full"
        >
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Security Check</h1>
          <p className="text-slate-500 mb-8 font-medium">
            {isMfaError 
              ? "To keep the platform safe, please complete Multi-Factor Authentication (MFA) to access the console."
              : "You must be an administrator to access the moderation panel."}
          </p>

          {isMfaError ? (
            <Button 
              onClick={handleMfaRequired}
              className="w-full h-14 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg text-lg"
            >
              Verify Identity
            </Button>
          ) : (
            <Link href="/" className="inline-block w-full px-6 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg">
              Return to application
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  // Final check for generic 403 (IP whitelist etc)
  if (error?.includes("403")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-6 font-medium">Your network or IP address is not authorized to access this secure zone.</p>
          <Link href="/" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-none">
                Maakon Console
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline-block">{i18n.language.startsWith("ar") ? "English" : "عربي"}</span>
              <span className="inline-block sm:hidden">{i18n.language.startsWith("ar") ? "EN" : "عربي"}</span>
            </button>
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block">
              Exit Console
            </Link>
            <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-700 leading-tight">{user.displayName || "Admin User"}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">System Admin</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-indigo-700">
                {user.displayName?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 md:py-10 max-w-7xl">
        {/* ── Stats Grid ──────────────────────────────────────────────────── */}
        {stats && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10"
          >
            <StatCard icon={<Activity />} label="Active posts" value={stats.posts.active} gradient="from-emerald-400 to-teal-500" shadowColor="shadow-emerald-200" />
            <StatCard icon={<EyeOff />} label="Hidden posts" value={stats.posts.hidden} gradient="from-orange-400 to-amber-500" shadowColor="shadow-orange-200" />
            <StatCard icon={<AlertTriangle />} label="Open reports" value={stats.reports.open} gradient="from-rose-400 to-red-500" shadowColor="shadow-rose-200" />
            <StatCard icon={<Building2 />} label="Verified NGOs" value={stats.ngos.verified} note={`/ ${stats.ngos.total} total`} gradient="from-indigo-400 to-purple-500" shadowColor="shadow-indigo-200" />
          </motion.div>
        )}

        {/* ── Controls & Tabs ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 self-stretch lg:self-auto overflow-x-auto hide-scrollbar">
            {(["posts", "reports", "ngos", "users"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-5 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                  tab === t
                    ? "text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab === t && (
                  <motion.div
                    layoutId="activeTabAdmin"
                    className="absolute inset-0 bg-slate-100 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {t === "posts" && <LayoutDashboard className="w-4 h-4" />}
                  {t === "reports" && <ClipboardList className="w-4 h-4" />}
                  {t === "ngos" && <Globe className="w-4 h-4" />}
                  {t === "users" && <Users className="w-4 h-4" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {stats && t !== "users" && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${tab === t ? "bg-white text-slate-600" : "bg-slate-100 text-slate-500"}`}>
                      {t === "posts" ? stats.posts.total : t === "reports" ? stats.reports.total : stats.ngos.total}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button
              size="default"
              variant="outline"
              onClick={runCleanup}
              className="text-sm font-semibold gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl"
            >
              <Clock className="w-4 h-4" />
              Run Expiry Cleanup
            </Button>
            {tab === "ngos" && (
              <Button
                size="default"
                variant="default"
                onClick={() => { setEditingNgo(null); setNgoModalOpen(true); }}
                className="text-sm font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create NGO
              </Button>
            )}
            <Button 
              size="default" 
              variant="default" 
              onClick={() => refresh(true)} 
              className="text-sm font-semibold gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <AnimatePresence>
              {cleanupResult && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 absolute right-8 -mt-16 bg-white/80 backdrop-blur-sm shadow-sm"
                >
                  {cleanupResult}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Loading / Error states */}
        {error && !error.includes("403") && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-sm font-medium text-red-600 mb-6 bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
            Error fetching {tab}: {error}. Is the database running?
          </motion.div>
        )}

        {/* ── Data Tables ─────────────────────────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={tab}
          className="bg-white rounded-3xl shadow-sm shadow-slate-200/50 border border-slate-200/60 overflow-hidden"
        >
          {/* Posts Table */}
          {tab === "posts" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle">
                <thead className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Title & Details</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-center">Reports</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && posts.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</td></tr>
                  ) : posts.map((post, index) => (
                    <tr key={post.id} className={`hover:bg-slate-50/80 transition-colors ${post.status !== "active" ? "opacity-75" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge status={post.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${post.postType === "need" ? "bg-rose-100 text-rose-700" : "bg-teal-100 text-teal-700"}`}>
                            {post.postType}
                          </span>
                          <div className="max-w-[250px] lg:max-w-[400px]">
                            <div className="font-bold text-slate-800 truncate" title={post.title}>{post.title}</div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">{post.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">{post.governorate}</td>
                      <td className="px-6 py-4 text-center">
                        {post.reportCount > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 bg-red-100 text-red-700 rounded-full font-bold text-xs">{post.reportCount}</span>
                        ) : (
                          <span className="text-slate-300 font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="text-slate-800 font-medium">{daysUntil(post.expiresAt)}</div>
                        <div className="text-slate-400 mt-0.5">Created {timeAgo(post.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end"><PostActions post={post} onUpdate={refresh} /></div>
                      </td>
                    </tr>
                  ))}
                  {!loading && posts.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium">No posts found in the system.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports Table */}
          {tab === "reports" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle">
                <thead className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Post Info</th>
                    <th className="px-6 py-4">Report Reason</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && reports.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</td></tr>
                  ) : reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap"><Badge status={report.status} /></td>
                      <td className="px-6 py-4">
                        <div className="max-w-[250px]">
                          <div className="font-bold text-slate-800 truncate group">
                            <span className="text-indigo-500 mr-1.5">#{report.postId}</span>
                            {report.postTitle}
                          </div>
                          <div className="mt-1">
                            <Badge status={report.postStatus} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 capitalize">{report.reason.replace(/_/g, " ")}</div>
                        {report.details && (
                          <div className="mt-1 text-xs text-slate-500 max-w-[280px] break-words line-clamp-2" title={report.details}>
                            {report.details}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{timeAgo(report.reportedAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end"><ReportActions report={report} onUpdate={refresh} /></div>
                      </td>
                    </tr>
                  ))}
                  {!loading && reports.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium">No active reports.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* NGOs Table */}
          {tab === "ngos" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle">
                <thead className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Organization</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && ngos.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</td></tr>
                  ) : ngos.map((ngo) => (
                    <tr key={ngo.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-[300px]">
                          <div className="font-bold text-slate-800 text-base truncate">{ngo.name}</div>
                          <div className="text-sm text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                             <Globe className="w-3.5 h-3.5 opacity-60" /> {ngo.governorate} {ngo.district ? `, ${ngo.district}` : ""}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {ngo.phone && <div className="truncate">{ngo.phone}</div>}
                        {ngo.website && (
                          <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 hover:underline truncate block max-w-[180px] mt-0.5">
                            {ngo.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                        {!ngo.phone && !ngo.website && <span className="text-slate-400 italic">No contact info</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ngo.verifiedAt ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 inline-flex">
                            <Shield className="w-4 h-4" />
                            <span className="font-bold text-xs">{new Date(ngo.verifiedAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-200 inline-flex">
                            <ShieldOff className="w-4 h-4 opacity-50" />
                            <span className="font-medium text-xs">Unverified</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <NgoActions ngo={ngo} onUpdate={refresh} onEdit={(n) => { setEditingNgo(n); setNgoModalOpen(true); }} />
                      </td>
                    </tr>
                  ))}
                  {!loading && ngos.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-medium">No NGOs registered.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Users Table */}
          {tab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle">
                <thead className="bg-slate-50/50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role / Type</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && usersList.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</td></tr>
                  ) : usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-[250px]">
                          <div className="font-bold text-slate-800 text-base truncate" title={u.displayName || "Unknown User"}>{u.displayName || "Unknown User"}</div>
                          <div className="text-sm text-slate-500 mt-0.5 truncate" title={u.email || "No email"}>{u.email || "No email"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        <div className="flex flex-col gap-1 items-start">
                           <Badge status={u.role} />
                           {u.accountType === "ngo" && (
                             <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md uppercase tracking-wider">NGO Account</span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                        {timeAgo(u.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           {u.role !== "admin" && (
                              <button
                                onClick={async () => {
                                  if (!confirm(`Are you sure you want to delete ${u.displayName || 'this user'}? This will also remove any related entities they created.`)) return;
                                  setLoading(true);
                                  try {
                                    await apiFetch(`/admin/users/${u.id}`, { method: "DELETE" });
                                    toast({ title: "Success", description: "User deleted successfully" });
                                    refresh();
                                  } catch (e) {
                                    toast({ variant: "destructive", title: "Error", description: `Failed to delete base user: ${e instanceof Error ? e.message : e}` });
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                disabled={loading}
                                className="flex items-center justify-center gap-1.5 min-w-[70px] text-xs font-medium border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-all disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                           )}
                           {u.role === "admin" && (
                              <span className="text-xs text-slate-400 italic">Cannot delete admin</span>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && usersList.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-medium">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      <NgoModal 
        open={ngoModalOpen} 
        onOpenChange={setNgoModalOpen} 
        ngo={editingNgo}
        onSave={handleSaveNgo} 
      />

    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, note, icon, gradient, shadowColor }: { label: string; value: number; note?: string; icon: React.ReactNode; gradient: string; shadowColor: string }) {
  return (
    <div className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-sm shadow-slate-200/50 border border-slate-100 group transition-all hover:shadow-md hover:-translate-y-1">
      {/* Decorative gradient orb */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-lg ${shadowColor}`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
        <div className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
        {note && <div className="text-xs font-semibold text-slate-400 mt-2">{note}</div>}
      </div>
    </div>
  );
}

