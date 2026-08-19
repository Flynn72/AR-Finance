import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowRight } from "lucide-react";
import type { DisputeSummary } from "../../lib/dashboardSelectors";
import { formatCurrencyCompact } from "../../lib/format";

export default function DisputeWidget({ summary }: { summary: DisputeSummary }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-info-bg text-info-text">
          <ShieldAlert size={16} />
        </div>
        <h3 className="text-sm font-semibold text-brand-950">Dispute Center</h3>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs text-brand-700">Total Nilai Disengketa</p>
          <p className="font-data mt-0.5 text-xl font-semibold text-brand-950">
            {formatCurrencyCompact(summary.totalDisputedAmount)}
          </p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-brand-700">Dispute Aktif</p>
            <p className="font-data mt-0.5 text-lg font-semibold text-brand-950">
              {summary.openCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-700">Perlu Perhatian Segera</p>
            <p className="font-data mt-0.5 text-lg font-semibold text-critical-text">
              {summary.urgentCount}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate("/ar-management/disputes")}
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-border-subtle bg-white py-2 text-sm font-medium text-brand-950 hover:bg-neutral-bg"
      >
        Tinjau Sekarang
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
