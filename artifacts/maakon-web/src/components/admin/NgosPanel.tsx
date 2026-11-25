import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import type { AdminNgo } from "./types";
import { Button } from "@/components/ui/button";
import { NgoActions } from "./Actions";
import { DataTable, dateTime } from "./DataTable";
import { useAdminApi } from "./adminApi";
const NgoModal = lazy(() =>
  import("./NgoModal").then((m) => ({ default: m.NgoModal })),
);
export function NgosPanel({
  ngos,
  onUpdate,
}: {
  ngos: AdminNgo[];
  onUpdate: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<AdminNgo | null | undefined>(
    undefined,
  );
  const api = useAdminApi();
  const { t } = useTranslation();
  return (
    <>
      <Button size="sm" className="mb-3" onClick={() => setEditing(null)}>
        Create NGO
      </Button>
      <p className="mb-3 text-sm text-slate-600">{t("admin_referral_check")}</p>
      <DataTable
        rows={ngos}
        empty="No NGOs registered."
        columns={[
          [
            "Organization",
            (n) => (
              <>
                <strong dir="auto">{n.name}</strong>
                <p>{[n.governorate, n.district].filter(Boolean).join(", ")}</p>
              </>
            ),
          ],
          [
            "Contact",
            (n) => (
              <>
                {n.phone}
                <p>
                  {n.website && /^https?:\/\//i.test(n.website) ? (
                    <a href={n.website} rel="noreferrer" target="_blank">
                      {n.website}
                    </a>
                  ) : (
                    n.website
                  )}
                </p>
              </>
            ),
          ],
          [
            "Verification",
            (n) => (
              <>
                {n.verifiedAt
                  ? `Verified · ${dateTime(n.verifiedAt)}`
                  : "Unverified"}
                <p className="text-xs text-slate-600">
                  {t(
                    n.referralApprovedAt
                      ? "admin_referral_approved"
                      : "admin_referral_unapproved",
                  )}
                </p>
              </>
            ),
          ],
          [
            "Action",
            (n) => (
              <NgoActions ngo={n} onEdit={setEditing} onUpdate={onUpdate} />
            ),
          ],
        ]}
      />
      {editing !== undefined && (
        <Suspense fallback={<p>Loading NGO editor…</p>}>
          <NgoModal
            open
            ngo={editing}
            onOpenChange={(open) => {
              if (!open) setEditing(undefined);
            }}
            onSave={async (data) => {
              await api(editing ? `/admin/ngos/${editing.id}` : "/admin/ngos", {
                method: editing ? "PATCH" : "POST",
                body: JSON.stringify(data),
              });
              await onUpdate();
            }}
          />
        </Suspense>
      )}
    </>
  );
}
