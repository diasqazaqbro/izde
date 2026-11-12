import type { ReactNode } from "react";

// A table on wide screens, a stack of cards on the phone. ARIA roles keep the table semantics
// that display:grid would drop. `cols` is a literal Tailwind class like "sm:grid-cols-[1fr_120px]".
export function DataTable({
  label,
  columns,
  rows,
  cols,
}: {
  label: string;
  columns: string[];
  rows: { key: string; cells: ReactNode[] }[];
  cols: string;
}) {
  return (
    <div role="table" aria-label={label} className="overflow-hidden rounded-card border border-line bg-surface">
      <div role="rowgroup">
        <div
          role="row"
          className={`max-sm:sr-only sm:grid sm:gap-4 ${cols} border-b border-line bg-page px-[22px] py-2.5 text-xs font-semibold tracking-[0.05em] text-muted uppercase`}
        >
          {columns.map((c) => (
            <span role="columnheader" key={c}>
              {c}
            </span>
          ))}
        </div>
      </div>
      <div role="rowgroup" className="divide-y divide-line">
        {rows.map((row) => (
          <div
            role="row"
            key={row.key}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-[22px] py-3.5 text-[15px] sm:grid sm:gap-4 ${cols}`}
          >
            {row.cells.map((cell, i) => (
              <div role="cell" key={i} className={i === 0 ? "min-w-0 basis-full break-words sm:basis-auto" : "text-muted"}>
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
