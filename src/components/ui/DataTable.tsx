import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import clsx from "clsx";
import { LoadingState, EmptyState } from "./StateViews";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  /** Jika diisi, kolom bisa di-sort berdasarkan nilai ini */
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | null;
}

type SortDirection = "asc" | "desc" | null;

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = "Belum ada data",
  emptyDescription,
  onRowClick,
  selectedRowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortValue) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const sortedRows = (() => {
    if (!sortKey || !sortDir) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  })();

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-neutral-bg/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-brand-700",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.sortValue && "cursor-pointer select-none hover:text-brand-950"
                )}
                onClick={() => toggleSort(col)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortValue &&
                    (sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading || sortedRows.length === 0 ? null : (
            sortedRows.map((row) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    "border-b border-border-subtle last:border-b-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-neutral-bg/60",
                    selectedRowKey === key && "bg-info-bg/50"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        "px-4 py-3 align-middle text-brand-950",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.className
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {loading && <LoadingState />}
      {!loading && sortedRows.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}
