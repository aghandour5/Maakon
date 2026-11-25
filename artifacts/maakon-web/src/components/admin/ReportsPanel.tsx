import type { AdminReport } from "./types";
import { ReportActions } from "./Actions";
import { DataTable, dateTime } from "./DataTable";
export function ReportsPanel({
  reports,
  onUpdate,
}: {
  reports: AdminReport[];
  onUpdate: () => void;
}) {
  return (
    <DataTable
      rows={reports}
      empty="No reports."
      columns={[
        [
          "Post",
          (r) => (
            <>
              <strong dir="auto">{r.postTitle}</strong>
              <p>
                #{r.postId} · {r.postStatus}
              </p>
            </>
          ),
        ],
        [
          "Report",
          (r) => (
            <>
              {r.reason}
              <p dir="auto">{r.details}</p>
            </>
          ),
        ],
        ["Reported", (r) => dateTime(r.reportedAt)],
        ["Status", (r) => r.status],
        ["Action", (r) => <ReportActions report={r} onUpdate={onUpdate} />],
      ]}
    />
  );
}
