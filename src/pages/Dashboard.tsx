import { useEffect, useMemo } from "react";
import { Wallet, AlertTriangle, Clock, PercentCircle } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import KPICard from "../components/ui/KPICard";
import { LoadingState, ErrorState } from "../components/ui/StateViews";
import AgingChart from "../components/charts/AgingChart";
import CashInflowChart from "../components/charts/CashInflowChart";
import HighPriorityOverdueWidget from "../components/dashboard/HighPriorityOverdueWidget";
import DisputeWidget from "../components/dashboard/DisputeWidget";
import CollectionProgressWidget from "../components/dashboard/CollectionProgressWidget";
import { useARStore } from "../store/useARStore";
import { computeDSO, computeCollectionRate } from "../lib/calculations";
import {
  getAgingDistribution,
  getCashInflowTrend,
  getHighPriorityOverdue,
  getDisputeSummary,
} from "../lib/dashboardSelectors";
import { formatCurrencyCompact, formatPercent } from "../lib/format";

export default function Dashboard() {
  const { status, error, init, customers, payments, disputes, getComputedInvoices } =
    useARStore();

  useEffect(() => {
    init();
  }, [init]);

  const computedInvoices = useMemo(
    () => (status === "ready" ? getComputedInvoices() : []),
    [status, getComputedInvoices]
  );

  const kpis = useMemo(() => {
    const totalOutstanding = computedInvoices.reduce((s, i) => s + i.outstanding, 0);
    const totalOverdue = computedInvoices
      .filter((i) => i.status === "Overdue" || i.status === "Escalated")
      .reduce((s, i) => s + i.outstanding, 0);
    const totalInvoiced = computedInvoices.reduce((s, i) => s + i.amount, 0);
    const totalPaid = computedInvoices.reduce((s, i) => s + i.paid_amount, 0);
    const dso = computeDSO(computedInvoices);
    const collectionRate = computeCollectionRate(computedInvoices);
    return { totalOutstanding, totalOverdue, totalInvoiced, totalPaid, dso, collectionRate };
  }, [computedInvoices]);

  const agingData = useMemo(() => getAgingDistribution(computedInvoices), [computedInvoices]);
  const cashInflowData = useMemo(() => getCashInflowTrend(payments), [payments]);
  const overdueRows = useMemo(
    () => getHighPriorityOverdue(computedInvoices, customers),
    [computedInvoices, customers]
  );
  const disputeSummary = useMemo(() => getDisputeSummary(disputes), [disputes]);

  return (
    <AppLayout
      title="Dashboard"
      description="Ringkasan kesehatan piutang dan performa penagihan secara real-time."
    >
      {status === "loading" || status === "idle" ? (
        <LoadingState label="Menyiapkan data awal..." />
      ) : status === "error" ? (
        <ErrorState description={error ?? undefined} onRetry={init} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              label="Total Outstanding"
              value={formatCurrencyCompact(kpis.totalOutstanding)}
              icon={<Wallet size={18} />}
            />
            <KPICard
              label="Total Overdue"
              value={formatCurrencyCompact(kpis.totalOverdue)}
              icon={<AlertTriangle size={18} />}
            />
            <KPICard
              label="Rata-rata DSO"
              value={`${kpis.dso} Hari`}
              icon={<Clock size={18} />}
            />
            <KPICard
              label="Collection Rate"
              value={formatPercent(kpis.collectionRate)}
              icon={<PercentCircle size={18} />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AgingChart data={agingData} />
            <CashInflowChart data={cashInflowData} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <HighPriorityOverdueWidget rows={overdueRows} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <DisputeWidget summary={disputeSummary} />
              <CollectionProgressWidget
                totalInvoiced={kpis.totalInvoiced}
                totalPaid={kpis.totalPaid}
                collectionRate={kpis.collectionRate}
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
