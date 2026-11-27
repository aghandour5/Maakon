import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Trash2, Shield, ShieldOff, Loader2, Edit2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminApi } from "./adminApi";
import type {
  PostStatus,
  ReportStatus,
  AdminPost,
  AdminNgo,
  AdminReport,
} from "./types";
import { useToast } from "@/hooks/use-toast";
const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600 border-emerald-200",
  frozen: "bg-sky-50 text-sky-800 border-sky-200",
  hidden: "bg-orange-50 text-orange-600 border-orange-200",
  resolved: "bg-blue-50 text-blue-600 border-blue-200",
  expired: "bg-slate-100 text-slate-500 border-slate-200",
  "pending review": "bg-amber-50 text-amber-600 border-amber-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  removed: "bg-red-50 text-red-600 border-red-200",
  reviewed: "bg-indigo-50 text-indigo-600 border-indigo-200",
  dismissed: "bg-slate-100 text-slate-500 border-slate-200",
  actioned: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Action dropdown ────────────────────────────────────────────────────────────

export function PostActions({
  post,
  onUpdate,
}: {
  post: AdminPost;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const { toast } = useToast();
  const apiFetch = useAdminApi();
  const act = async (status: PostStatus) => {
    setLoading(true);
    try {
      await apiFetch(`/admin/posts/${post.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note: `Set by admin panel` }),
      });
      toast({ title: "Success", description: `Post marked as ${status}` });
      onUpdate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed: ${e instanceof Error ? e.message : e}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const requestStatusChange = (status: PostStatus) => {
    if (status === "removed") {
      setRemoveDialogOpen(true);
      return;
    }

    void act(status);
  };

  const choices = {
    active: "Restore active",
    hidden: "Hide",
    resolved: "Mark resolved",
    expired: "Mark expired",
    removed: "Remove",
  } as const;
  return (
    <>
      <select
        aria-label="Change post visibility"
        className="rounded border p-2"
        disabled={loading}
        value=""
        onChange={(event) =>
          requestStatusChange(event.target.value as PostStatus)
        }
      >
        <option value="" disabled>
          Change visibility
        </option>
        {Object.entries(choices)
          .filter(([status]) => status !== post.status)
          .map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
      </select>
      <AlertDialog
        open={removeDialogOpen}
        onOpenChange={(nextOpen) => {
          if (loading) return;
          setRemoveDialogOpen(nextOpen);
        }}
      >
        <AlertDialogContent dir="ltr" lang="en">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this post? It will no longer be
              visible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(event) => {
                event.preventDefault();
                void act("removed").finally(() => setRemoveDialogOpen(false));
              }}
            >
              {loading && (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ReviewActions({ post, onUpdate }: { post: AdminPost; onUpdate: () => Promise<void> }) {
  const apiFetch = useAdminApi();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  async function decide(decision: "accept" | "freeze" | "reject") {
    setBusy(true);
    try {
      await apiFetch(`/admin/posts/${post.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          decision, expectedUpdatedAt: decision === "accept" ? post.updatedAt : undefined,
          reason: decision === "reject" ? reason.trim() : undefined,
        }),
      });
      toast({ title: { accept: "Request accepted", freeze: "Request frozen", reject: "Request rejected" }[decision] });
      setRejectOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Review could not be saved",
        description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      await onUpdate();
      setBusy(false);
    }
  }
  const buttonClass = "rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-2">
      <button className={buttonClass + " bg-emerald-700 text-white"} disabled={busy} onClick={() => void decide("accept")}>Accept</button>
      {post.status === "pending" && <button className={buttonClass} disabled={busy} onClick={() => void decide("freeze")}>Freeze</button>}
      <button className={buttonClass + " text-red-700"} disabled={busy} onClick={() => { setReason(""); setRejectOpen(true); }}>Reject</button>
      <AlertDialog open={rejectOpen} onOpenChange={open => { if (!busy) setRejectOpen(open); }}>
        <AlertDialogContent dir="ltr" lang="en">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this request?</AlertDialogTitle>
            <AlertDialogDescription>This deletes the request and its reports. The reason is recorded in the audit log.</AlertDialogDescription>
          </AlertDialogHeader>
          <label className="grid gap-2 text-sm">Reason for rejection
            <textarea className="rounded border p-2" value={reason} required maxLength={500}
              onChange={event => setReason(event.target.value)} />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy || !reason.trim()} onClick={event => {
              event.preventDefault();
              void decide("reject");
            }}>Reject request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Report actions ─────────────────────────────────────────────────────────────

export function ReportActions({
  report,
  onUpdate,
}: {
  report: AdminReport;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState<ReportStatus | null>(null);
  const { toast } = useToast();
  const apiFetch = useAdminApi();

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
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed: ${e instanceof Error ? e.message : e}`,
      });
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

export function NgoActions({
  ngo,
  onUpdate,
  onEdit,
}: {
  ngo: AdminNgo;
  onUpdate: () => void;
  onEdit: (ngo: AdminNgo) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const apiFetch = useAdminApi();
  const canApproveReferral = Boolean(ngo.verifiedAt) && ngo.status === "active";

  const toggleReferral = async () => {
    setLoading(true);
    try {
      const method = ngo.referralApprovedAt ? "DELETE" : "PATCH";
      await apiFetch(`/admin/ngos/${ngo.id}/referral`, { method });
      onUpdate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed: ${e instanceof Error ? e.message : e}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerify = async () => {
    setLoading(true);
    try {
      const method = ngo.verifiedAt ? "DELETE" : "PATCH";
      await apiFetch(`/admin/ngos/${ngo.id}/verify`, { method });
      toast({
        title: "Success",
        description: `NGO verification status updated`,
      });
      onUpdate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed: ${e instanceof Error ? e.message : e}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await apiFetch(`/admin/ngos/${ngo.id}`, { method: "DELETE" });
      toast({ title: "Success", description: "NGO deleted successfully" });
      onUpdate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete: ${e instanceof Error ? e.message : e}`,
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          onClick={() => setDeleteDialogOpen(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 min-w-[70px] text-xs font-medium border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          Delete
        </button>
        <button
          onClick={() => onEdit(ngo)}
          className="flex items-center justify-center gap-1.5 min-w-[70px] text-xs font-medium border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
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
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : ngo.verifiedAt ? (
            <ShieldOff className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {ngo.verifiedAt ? "Unverify" : "Verify Logo"}
        </button>
        <button
          type="button"
          onClick={toggleReferral}
          disabled={loading || (!ngo.referralApprovedAt && !canApproveReferral)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {t(ngo.referralApprovedAt ? "admin_referral_revoke" : "admin_referral_approve")}
        </button>
      </div>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(nextOpen) => {
          if (loading) return;
          setDeleteDialogOpen(nextOpen);
        }}
      >
        <AlertDialogContent dir="ltr" lang="en">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete NGO?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this NGO? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {loading && (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
