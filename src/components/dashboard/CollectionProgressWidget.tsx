import { Target } from "lucide-react";
import ProgressBar from "../ui/ProgressBar";
import { formatCurrencyCompact, formatPercent } from "../../lib/format";

interface CollectionProgressWidgetProps {
  totalInvoiced: number;
  totalPaid: number;
  collectionRate: number;
}

export default function CollectionProgressWidget({
  totalInvoiced,
  totalPaid,
  collectionRate,
}: CollectionProgressWidgetProps) {
  const tone = collectionRate >= 80 ? "success" : collectionRate >= 50 ? "warning" : "critical";

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-success-bg text-success-text">
          <Target size={16} />
        </div>
        <h3 className="text-sm font-semibold text-brand-950">Collection Progress</h3>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="font-data text-2xl font-semibold text-brand-950">
            {formatPercent(collectionRate)}
          </span>
          <span className="text-xs text-brand-700">dari total tagihan</span>
        </div>
        <ProgressBar value={collectionRate} tone={tone} className="mt-2" />
      </div>

      <div className="mt-4 flex justify-between text-xs">
        <div>
          <p className="text-brand-700">Terkumpul</p>
          <p className="font-data mt-0.5 font-medium text-brand-950">
            {formatCurrencyCompact(totalPaid)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-brand-700">Total Ditagihkan</p>
          <p className="font-data mt-0.5 font-medium text-brand-950">
            {formatCurrencyCompact(totalInvoiced)}
          </p>
        </div>
      </div>
    </div>
  );
}
