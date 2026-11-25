import { useEffect, useState, useSyncExternalStore, useRef } from "react";
import { Link } from "wouter";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AdminApiContext,
  adminFetch,
  isGateError,
  type AdminApiError,
} from "@/components/admin/adminApi";
import {
  AdminResource,
  oncePerSession,
  refreshResources,
} from "@/components/admin/adminResourceStore";
import { AdminTabs, StatsStrip } from "@/components/admin/AdminTabs";
import { PostsPanel } from "@/components/admin/PostsPanel";
import { ReportsPanel } from "@/components/admin/ReportsPanel";
import { NgosPanel } from "@/components/admin/NgosPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import type { Tab, Resources } from "@/components/admin/types";

function Gate({
  message,
  action,
  label,
}: {
  message: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <main dir="ltr" lang="en" className="mx-auto mt-20 max-w-sm space-y-4 p-4">
      <h1 className="text-xl font-semibold">Maakon Console</h1>
      <p role="status">{message}</p>
      {action && <Button onClick={action}>{label}</Button>}{" "}
      <Link href="/">Exit Console</Link>
    </main>
  );
}
export default function AdminPage() {
  const { user, isLoading, mfaStatus, openAuthModal, setMfaStatus } = useAuth();
  const verify = () => {
    setMfaStatus(user?.mfaEnabled ? "mfa_challenge" : "mfa_setup_required");
    openAuthModal();
  };
  if (isLoading) return <Gate message="Checking session…" />;
  if (!user || user.role !== "admin")
    return (
      <Gate
        message="An administrator account is required."
        action={!user ? openAuthModal : undefined}
        label="Sign in"
      />
    );
  if (!user.mfaVerified || mfaStatus)
    return (
      <Gate
        message="Verify your identity to open the console."
        action={verify}
        label="Verify identity"
      />
    );
  return <Console key={user.id} user={user} onMfa={verify} />;
}
function useResource<T>(resource: AdminResource<T>) {
  return useSyncExternalStore(resource.subscribe, resource.snapshot);
}
function Console({ user, onMfa }: { user: AuthUser; onMfa: () => void }) {
  const [tab, setTab] = useState<Tab>("posts"),
    [gate, setGate] = useState<AdminApiError | null>(null);
  const currentTab = useRef(tab);
  const changeTab = (next: Tab) => {
    currentTab.current = next;
    setTab(next);
  };
  const { toast } = useToast(),
    { openAuthModal } = useAuth();
  const [{ api, resources }] = useState(() => {
    const escalate = oncePerSession((error: AdminApiError) => {
      setGate(error);
      if (error.kind === "mfa") onMfa();
    });
    const api: typeof adminFetch = async (path, options) => {
      try {
        return await adminFetch(path, options);
      } catch (e) {
        if (!options?.signal?.aborted && isGateError(e)) escalate(e);
        throw e;
      }
    };
    const resource = <K extends keyof Resources>(key: K) =>
      new AdminResource<Resources[K]>((signal) =>
        api("/admin/" + key, { signal }),
      );
    return {
      api,
      resources: {
        posts: resource("posts"),
        reports: resource("reports"),
        ngos: resource("ngos"),
        users: resource("users"),
        stats: resource("stats"),
      },
    };
  });
  const stats = useResource(resources.stats);
  const panels = {
    posts: useResource(resources.posts),
    reports: useResource(resources.reports),
    ngos: useResource(resources.ngos),
    users: useResource(resources.users),
  };
  const active = panels[tab];
  useEffect(() => {
    void resources.stats.load().catch(() => {});
    return () => Object.values(resources).forEach((r) => r.invalidate());
  }, [resources]);
  useEffect(() => {
    void resources[tab].load().catch(() => {});
  }, [tab, resources]);
  const refresh = async (manual = false) => {
    const visible = currentTab.current;
    const failures = await refreshResources({
      stats: resources.stats,
      [visible]: resources[visible],
    });
    if (failures.length)
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: failures.join(" · "),
      });
    else if (manual)
      toast({ title: "Refreshed", description: "Latest data loaded." });
  };
  const updated = async () => {
    Object.values(resources).forEach((r) => r.invalidate());
    await refresh();
  };
  const cleanup = async () => {
    try {
      const result = await api<{ message: string }>("/admin/cleanup", {
        method: "POST",
      });
      toast({ title: result.message });
      await updated();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Cleanup failed",
        description: String(e),
      });
    }
  };
  if (gate)
    return (
      <Gate
        message={gate.message}
        action={
          gate.kind === "mfa"
            ? onMfa
            : gate.kind === "auth"
              ? openAuthModal
              : undefined
        }
        label={gate.kind === "mfa" ? "Verify identity" : "Sign in"}
      />
    );
  return (
    <AdminApiContext.Provider value={api}>
      <div
        dir="ltr"
        lang="en"
        className="min-h-screen bg-slate-50 text-slate-900"
      >
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-8">
            <h1 className="mr-auto text-xl font-semibold tracking-tight">
              Maakon Console
            </h1>
            <span className="text-sm text-slate-600">
              {user.displayName || user.email}
            </span>
            <Link className="text-sm font-medium underline" href="/">
              Exit Console
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-8">
          {stats.data && <StatsStrip stats={stats.data} />}
          {stats.error && (
            <p role="alert">
              Stats · {stats.error.message}{" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => resources.stats.load(true).catch(() => {})}
              >
                Retry stats
              </Button>
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AdminTabs tab={tab} onChange={changeTab} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cleanup}>
                Run expiry cleanup
              </Button>
              <Button variant="outline" size="sm" onClick={() => refresh(true)}>
                Refresh
              </Button>
            </div>
          </div>
          {active.error && (
            <p role="alert" className="rounded border bg-white p-3">
              {tab} · {active.error.message}{" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => resources[tab].load(true).catch(() => {})}
              >
                Retry
              </Button>
            </p>
          )}
          {(active.loading || active.refreshing) && (
            <p role="status" className="text-sm text-slate-600">
              {active.refreshing ? "Refreshing" : "Loading"} {tab}…
            </p>
          )}
          {tab === "posts" && panels.posts.data && (
            <PostsPanel posts={panels.posts.data} onUpdate={updated} />
          )}
          {tab === "reports" && panels.reports.data && (
            <ReportsPanel reports={panels.reports.data} onUpdate={updated} />
          )}
          {tab === "ngos" && panels.ngos.data && (
            <NgosPanel ngos={panels.ngos.data} onUpdate={updated} />
          )}
          {tab === "users" && panels.users.data && (
            <UsersPanel users={panels.users.data} onUpdate={updated} />
          )}
        </main>
      </div>
    </AdminApiContext.Provider>
  );
}
