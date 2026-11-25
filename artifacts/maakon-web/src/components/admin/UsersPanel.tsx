import { useState } from "react";
import type { AdminUser } from "./types";
import { DataTable, dateTime } from "./DataTable";
import { useAdminApi } from "./adminApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function UsersPanel({
  users,
  onUpdate,
}: {
  users: AdminUser[];
  onUpdate: () => Promise<void>;
}) {
  const [target, setTarget] = useState<AdminUser | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const api = useAdminApi();
  const remove = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await api(`/admin/users/${target.id}`, { method: "DELETE" });
      await onUpdate();
      setTarget(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <DataTable
        rows={users}
        empty="No users."
        columns={[
          [
            "User",
            (u) => (
              <>
                <strong>{u.displayName || "Unnamed user"}</strong>
                <p>{u.email}</p>
              </>
            ),
          ],
          ["Role", (u) => u.role],
          ["Account", (u) => u.accountType],
          ["Joined", (u) => dateTime(u.createdAt)],
          [
            "Action",
            (u) =>
              u.role === "admin" ? (
                "—"
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setError("");
                    setTarget(u);
                  }}
                >
                  Delete
                </Button>
              ),
          ],
        ]}
      />
      <Dialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open && !busy) setTarget(null);
        }}
      >
        <DialogContent dir="ltr" lang="en">
          <DialogTitle>Delete user?</DialogTitle>
          <DialogDescription>
            Delete {target?.displayName || target?.email} and their posts?
          </DialogDescription>
          {error && <p role="alert">{error}</p>}
          <div className="flex gap-2">
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => setTarget(null)}
            >
              Cancel
            </Button>
            <Button disabled={busy} variant="destructive" onClick={remove}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
