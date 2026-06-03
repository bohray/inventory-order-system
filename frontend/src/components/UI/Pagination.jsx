import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { cn } from "../../utils/cn.js";
import { PAGE_SIZE_OPTIONS } from "../../constants/app-data.js";

function pageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...items]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({
  page,
  pages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  if (total <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageBtn =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>
          Showing <span className="font-medium text-slate-700">{start}</span>–
          <span className="font-medium text-slate-700">{end}</span> of{" "}
          <span className="font-medium text-slate-700">{total}</span>
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-brand-500"
          aria-label="Rows per page"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          className={cn(
            pageBtn,
            "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          )}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <LuChevronLeft size={16} />
        </button>

        {pageItems(page, pages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                pageBtn,
                p === page
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          className={cn(
            pageBtn,
            "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          )}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <LuChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
