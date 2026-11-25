import type { ReactNode } from "react";

export function DataTable<T extends { id: number }>({
  rows,
  columns,
  empty,
}: {
  rows: T[];
  columns: [string, (row: T) => ReactNode][];
  empty: string;
}) {
  if (!rows.length)
    return (
      <p className="rounded-lg border bg-white px-4 py-8 text-center text-slate-600">
        {empty}
      </p>
    );
  return (
    <table className="block w-full text-left text-sm md:table md:overflow-hidden md:rounded-lg md:bg-white">
      <thead className="hidden border-b bg-slate-100 text-xs text-slate-600 md:table-header-group">
        <tr>
          {columns.map(([name]) => (
            <th scope="col" key={name} className="px-4 py-3">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="grid gap-3 md:table-row-group">
        {rows.map((row) => (
          <tr
            key={row.id}
            className="grid gap-2 rounded-lg border bg-white p-4 md:table-row"
          >
            {columns.map(([name, render], i) => (
              <td
                key={name}
                className="min-w-0 break-words align-top md:px-4 md:py-3"
              >
                {i > 0 && (
                  <span className="block text-xs text-slate-500 md:hidden">
                    {name}
                  </span>
                )}
                {render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export const dateTime = (date: string | null) =>
  date
    ? new Date(date).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
