import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Wallet, Clock, AlertTriangle, PercentCircle, Download, FileDown } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import KPICard from "../components/ui/KPICard";
import Button from "../components/ui/Button";
import DataTable, { type DataTableColumn } from "../components/ui/DataTable";
import ChartCard from "../components/charts/ChartCard";
import AgingChart from "../components/charts/AgingChart";
import { RiskBadge } from "../components/ui/Badge";
import { LoadingState, ErrorState } from "../components/ui/StateViews";
import { useToast } from "../components/ui/Toast";
import { useARStore } from "../store/useARStore";
import { computeDSO } from "../lib/calculations";
import {
  getAgingSchedule,
  getMonthlyCollectionReport,
  getOverdueByIndustry,
  getCustomerExposureReport,
  getCollectionEfficiency,
  type AgingScheduleRow,
  type IndustryOverdueRow,
  type CustomerExposureRow,
} from "../lib/reportSelectors";
import { exportToExcel, exportToPdf } from "../lib/exportService";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "../lib/format";

const EXPOSURE_STATUS_LABEL: Record<CustomerExposureRow["status"], string> = {
  Escalated: "Eskalasi",
  "PTP Broken": "PTP Gagal",
  Disputed: "Disengketa",
  Normal: "Normal",
};

export default function Reports() {
  const { status, error, init, customers, payments, getComputedInvoices } = useARStore();
  const { show } = useToast();
  const [monthsBack, setMonthsBack] = useState(6);

  useEffect(() => {
    init();
  }, [init]);

  const invoices = useMemo(
    () => (status === "ready" ? getComputedInvoices() : []),
    [status, getComputedInvoices]
  );

  const kpis = useMemo(() => {
    const totalBalance = invoices.reduce((s, i) => s + i.outstanding, 0);
    const dso = computeDSO(invoices);
    const overdue30 = invoices
      .filter((i) => i.aging_days > 30)
      .reduce((s, i) => s + i.outstanding, 0);
    const efficiency = getCollectionEfficiency(invoices);
    return { totalBalance, dso, overdue30, efficiency };
  }, [invoices]);

  const agingSchedule = useMemo(() => getAgingSchedule(invoices), [invoices]);
  const monthlyReport = useMemo(
    () => getMonthlyCollectionReport(invoices, payments, monthsBack),
    [invoices, payments, monthsBack]
  );
  const industryOverdue = useMemo(() => getOverdueByIndustry(customers, invoices), [customers, invoices]);
  const customerExposure = useMemo(
    () => getCustomerExposureReport(customers, invoices),
    [customers, invoices]
  );

  const agingColumns: DataTableColumn<AgingScheduleRow>[] = [
    { key: "label", header: "Bucket", render: (r) => r.label },
    {
      key: "count",
      header: "Jumlah Invoice",
      align: "right",
      render: (r) => <span className="font-data">{r.count}</span>,
    },
    {
      key: "amount",
      header: "Total Outstanding",
      align: "right",
      render: (r) => <span className="font-data">{formatCurrency(r.amount)}</span>,
    },
    {
      key: "percentage",
      header: "% dari Total",
      align: "right",
      render: (r) => <span className="font-data">{formatPercent(r.percentage)}</span>,
    },
  ];

  const industryColumns: DataTableColumn<IndustryOverdueRow>[] = [
    { key: "industry", header: "Industri", render: (r) => r.industry },
    {
      key: "exposure",
      header: "Total Exposure",
      align: "right",
      render: (r) => <span className="font-data">{formatCurrency(r.totalExposure)}</span>,
    },
    {
      key: "over90",
      header: ">90 Hari",
      align: "right",
      render: (r) => (
        <span className="font-data text-critical-text">{formatCurrency(r.overdue90Plus)}</span>
      ),
    },
  ];

  const exposureColumns: DataTableColumn<CustomerExposureRow>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (r) => (
        <div>
          <p className="font-medium">{r.customer.customer_name}</p>
          <p className="text-xs text-brand-700">{r.customer.industry}</p>
        </div>
      ),
    },
    {
      key: "exposure",
      header: "Total Exposure",
      align: "right",
      render: (r) => <span className="font-data">{formatCurrency(r.totalExposure)}</span>,
    },
    {
      key: "over90",
      header: ">90 Hari",
      align: "right",
      render: (r) => <span className="font-data">{formatCurrency(r.overdue90Plus)}</span>,
    },
    { key: "risk", header: "Risk", render: (r) => <RiskBadge level={r.customer.risk_level} /> },
    { key: "status", header: "Status", render: (r) => EXPOSURE_STATUS_LABEL[r.status] },
  ];

  const handleExportExcel = async () => {
    await exportToExcel(`AR-Report-${new Date().toISOString().slice(0, 10)}`, [
      {
        name: "Aging Schedule",
        headers: ["Bucket", "Jumlah Invoice", "Total Outstanding", "% dari Total"],
        rows: agingSchedule.map((r) => [r.label, r.count, r.amount, `${r.percentage.toFixed(1)}%`]),
        currencyColumns: [2],
      },
      {
        name: "Monthly Collection",
        headers: ["Bulan", "Ditagihkan", "Tertagih", "Collection Rate"],
        rows: monthlyReport.map((r) => [
          r.label,
          r.billed,
          r.collected,
          `${r.collectionRate.toFixed(1)}%`,
        ]),
        currencyColumns: [1, 2],
      },
      {
        name: "Overdue by Industry",
        headers: ["Industri", "Total Exposure", ">90 Hari"],
        rows: industryOverdue.map((r) => [r.industry, r.totalExposure, r.overdue90Plus]),
        currencyColumns: [1, 2],
      },
      {
        name: "Customer Exposure",
        headers: ["Customer", "Industri", "Total Exposure", ">90 Hari", "Risk", "Status"],
        rows: customerExposure.map((r) => [
          r.customer.customer_name,
          r.customer.industry,
          r.totalExposure,
          r.overdue90Plus,
          r.customer.risk_level,
          EXPOSURE_STATUS_LABEL[r.status],
        ]),
        currencyColumns: [2, 3],
      },
    ]);
    show("Laporan Excel berhasil diunduh.", "success");
  };

  const handleExportPdf = async () => {
    await exportToPdf(`AR-Report-${new Date().toISOString().slice(0, 10)}`, "Laporan Accounts Receivable", [
      {
        heading: "Aging Schedule",
        columns: ["Bucket", "Jumlah Invoice", "Outstanding", "% Total"],
        rows: agingSchedule.map((r) => [r.label, r.count, formatCurrency(r.amount), `${r.percentage.toFixed(1)}%`]),
      },
      {
        heading: "Customer Exposure Tertinggi",
        columns: ["Customer", "Total Exposure", ">90 Hari", "Status"],
        rows: customerExposure
          .slice(0, 10)
          .map((r) => [
            r.customer.customer_name,
            formatCurrency(r.totalExposure),
            formatCurrency(r.overdue90Plus),
            EXPOSURE_STATUS_LABEL[r.status],
          ]),
      },
    ]);
    show("Laporan PDF berhasil diunduh.", "success");
  };

  return (
    <AppLayout
      title="Reports & Analytics"
      description="Aging schedule, efektivitas penagihan, dan eksposur customer."
      actions={
        <>
          <Button size="sm" icon={<Download size={14} />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button size="sm" variant="primary" icon={<FileDown size={14} />} onClick={handleExportPdf}>
            Export PDF
          </Button>
        </>
      }
    >
      {status === "loading" || status === "idle" ? (
        <LoadingState label="Menyiapkan laporan..." />
      ) : status === "error" ? (
        <ErrorState description={error ?? undefined} onRetry={init} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              label="Total AR Balance"
              value={formatCurrencyCompact(kpis.totalBalance)}
              icon={<Wallet size={18} />}
            />
            <KPICard label="Rata-rata DSO" value={`${kpis.dso} Hari`} icon={<Clock size={18} />} />
            <KPICard
              label="Overdue (>30 Hari)"
              value={formatCurrencyCompact(kpis.overdue30)}
              icon={<AlertTriangle size={18} />}
            />
            <KPICard
              label="Collection Efficiency"
              value={formatPercent(kpis.efficiency)}
              icon={<PercentCircle size={18} />}
            />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-brand-950">AR Aging Schedule</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <AgingChart data={agingSchedule} />
              <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
                <DataTable
                  columns={agingColumns}
                  rows={agingSchedule}
                  rowKey={(r) => r.bucket}
                  emptyTitle="Tidak ada data aging"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-950">Monthly Collection Trend</h2>
              <div className="flex gap-1.5">
                {[3, 6, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonthsBack(m)}
                    className={`rounded-[var(--radius-control)] px-2.5 py-1 text-xs font-medium transition-colors ${
                      monthsBack === m
                        ? "bg-brand-950 text-white"
                        : "border border-border-subtle text-brand-700 hover:bg-neutral-bg"
                    }`}
                  >
                    {m} Bulan
                  </button>
                ))}
              </div>
            </div>
            <ChartCard title="Ditagihkan vs Tertagih" subtitle="Perbandingan nilai invoice terbit dan pembayaran diterima per bulan">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReport} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#475569" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrencyCompact(v)}
                      width={64}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === "billed" ? "Ditagihkan" : "Tertagih",
                      ]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontFamily: "Inter" }}
                    />
                    <Bar dataKey="billed" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="collected" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-brand-950">Overdue Analysis per Industri</h2>
              <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
                <DataTable
                  columns={industryColumns}
                  rows={industryOverdue}
                  rowKey={(r) => r.industry}
                  emptyTitle="Tidak ada data overdue per industri"
                />
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold text-brand-950">
                Customer Exposure Tertinggi
              </h2>
              <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
                <DataTable
                  columns={exposureColumns}
                  rows={customerExposure}
                  rowKey={(r) => r.customer.customer_code}
                  emptyTitle="Tidak ada data eksposur customer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
