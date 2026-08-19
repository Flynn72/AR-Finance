import type { ReactNode } from "react";
import clsx from "clsx";
import { TrendingDown, TrendingUp } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  trend?: {
    direction: "up" | "down";
    label: string;
    /** Untuk KPI, "up" tidak selalu positif (mis. Overdue naik = buruk) */
    tone: "positive" | "negative";
  };
  className?: string;
}

export default function KPICard({ label, value, icon, trend, className }: KPICardProps) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm text-brand-700">{label}</span>
        {icon && <span className="text-brand-700">{icon}</span>}
      </div>
      <div className="mt-2 font-data text-[28px] font-semibold leading-tight text-brand-950">
        {value}
      </div>
      {trend && (
        <div
          className={clsx(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            trend.tone === "positive" ? "text-success-text" : "text-critical-text"
          )}
        >
          {trend.direction === "up" ? (
            <TrendingUp size={14} />
          ) : (
            <TrendingDown size={14} />
          )}
          <span className="font-data">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
