import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, legend, children }: ChartCardProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-950">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-brand-700">{subtitle}</p>}
        </div>
        <button
          className="rounded p-1 text-brand-700 hover:bg-neutral-bg"
          aria-label="Opsi lainnya"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
      {legend && <div className="mt-3">{legend}</div>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
