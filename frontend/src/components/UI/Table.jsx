import { cn } from "../../utils/cn.js";

/**
 * Generic data table with a built-in skeleton loader and empty state.
 *
 * columns: [{ key, header, render?(row), align?: "left"|"right"|"center", className? }]
 * data:    array of row objects
 * rowKey:  (row) => unique key (default row.id)
 */
export default function Table({
  columns,
  data = [],
  rowKey = (row) => row.id,
  loading = false,
  emptyMessage = "No records found.",
  skeletonRows = 5,
  minWidth = "min-w-[560px]",
  className = "card overflow-x-auto",
}) {
  const alignClass = (align) =>
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  return (
    <div className={className}>
      <table className={cn("w-full text-sm", minWidth)}>
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3", alignClass(col.align))}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, r) => (
              <tr key={r} className="border-b border-slate-100 last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3",
                      alignClass(col.align),
                      col.className
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
