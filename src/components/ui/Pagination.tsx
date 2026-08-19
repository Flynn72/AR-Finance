import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import Button from "./Button";

interface PaginationProps {
  page: number; // 1-indexed
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pageNumbers = getPageWindow(page, totalPages);

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <span className="text-sm text-brand-700">
        Menampilkan <span className="font-data">{from}</span>–
        <span className="font-data">{to}</span> dari{" "}
        <span className="font-data">{total}</span> data
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </Button>
        {pageNumbers.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-sm text-brand-700">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={clsx(
                "h-8 min-w-8 rounded-[var(--radius-control)] px-2 text-sm font-medium transition-colors",
                p === page
                  ? "bg-brand-950 text-white"
                  : "text-brand-700 hover:bg-neutral-bg"
              )}
            >
              {p}
            </button>
          )
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

function getPageWindow(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const window: (number | "...")[] = [1];
  if (page > 3) window.push("...");
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
    window.push(p);
  }
  if (page < totalPages - 2) window.push("...");
  window.push(totalPages);
  return window;
}
