import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Wallet, TriangleAlert } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import KPICard from "../components/ui/KPICard";
import FilterBar from "../components/ui/FilterBar";
import DataTable, { type DataTableColumn } from "../components/ui/DataTable";
import { RiskBadge } from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import { LoadingState, ErrorState } from "../components/ui/StateViews";
import { useARStore } from "../store/useARStore";
import { getCustomerRows, type CustomerRow } from "../lib/customerSelectors";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "../lib/format";
import type { RiskLevel } from "../types";

type FilterValue = "all" | RiskLevel;

export default function Customers() {
  const navigate = useNavigate();
  const { status, error, init, customers, getComputedInvoices } = useARStore();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    init();
  }, [init]);

  const rows = useMemo(() => {
    if (status !== "ready") return [];
    return getCustomerRows(customers, getComputedInvoices());
  }, [status, customers, getComputedInvoices]);

  const kpis = useMemo(() => {
    const totalExposure = rows.reduce((s, r) => s + r.summary.outstanding, 0);
    const activeCount = rows.filter((r) => r.customer.status === "Active").length;
    const atRiskCount = rows.filter(
      (r) => r.customer.risk_level === "High" || r.customer.risk_level === "Critical"
    ).length;
    return { totalExposure, activeCount, atRiskCount };
  }, [rows]);

  const chips = useMemo(() => {
    const counts: Record<FilterValue, number> = {
      all: rows.length,
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    for (const r of rows) counts[r.customer.risk_level]++;
    return [
      { label: "Semua", value: "all", count: counts.all },
      { label: "Risiko Rendah", value: "Low", count: counts.Low },
      { label: "Risiko Sedang", value: "Medium", count: counts.Medium },
      { label: "Risiko Tinggi", value: "High", count: counts.High },
      { label: "Risiko Kritis", value: "Critical", count: counts.Critical },
    ];
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (activeFilter !== "all") result = result.filter((r) => r.customer.risk_level === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.customer.customer_name.toLowerCase().includes(q) ||
          r.customer.customer_code.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => b.summary.outstanding - a.summary.outstanding);
  }, [rows, activeFilter, search]);

  const columns: DataTableColumn<CustomerRow>[] = [
    {
      key: "name",
      header: "Customer",
      sortValue: (row) => row.customer.customer_name,
      render: (row) => (
        <div>
          <p className="font-medium text-brand-950">{row.customer.customer_name}</p>
          <p className="font-data text-xs text-brand-700">{row.customer.customer_code}</p>
        </div>
      ),
    },
    {
      key: "industry",
      header: "Industri",
      sortValue: (row) => row.customer.industry,
      render: (row) => row.customer.industry,
    },
    {
      key: "exposure",
      header: "Total Exposure",
      align: "right",
      sortValue: (row) => row.summary.outstanding,
      render: (row) => <span className="font-data">{formatCurrency(row.summary.outstanding)}</span>,
    },
    {
      key: "utilization",
      header: "Credit Utilization",
      render: (row) => (
        <div className="min-w-[120px]">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-data">{formatPercent(row.summary.credit_utilization, 0)}</span>
            <span className="font-data text-brand-700">{formatCurrencyCompact(row.customer.credit_limit)}</span>
          </div>
          <ProgressBar value={row.summary.credit_utilization} />
        </div>
      ),
      sortValue: (row) => row.summary.credit_utilization,
    },
    {
      key: "dso",
      header: "DSO",
      align: "right",
      sortValue: (row) => row.dso,
      render: (row) => <span className="font-data">{row.dso} hari</span>,
    },
    {
      key: "risk",
      header: "Risk Profile",
      render: (row) => <RiskBadge level={row.customer.risk_level} />,
    },
  ];

  return (
    <AppLayout
      title="Customers & Credit Control"
      description="Direktori pelanggan, profil risiko, dan batas kredit."
    >
      {status === "loading" || status === "idle" ? (
        <LoadingState label="Memuat data customer..." />
      ) : status === "error" ? (
        <ErrorState description={error ?? undefined} onRetry={init} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard label="Total Customer" value={String(rows.length)} icon={<Users size={18} />} />
            <KPICard
              label="Customer Aktif"
              value={String(kpis.activeCount)}
              icon={<Users size={18} />}
            />
            <KPICard
              label="Total Exposure"
              value={formatCurrencyCompact(kpis.totalExposure)}
              icon={<Wallet size={18} />}
            />
            <KPICard
              label="Risiko Tinggi/Kritis"
              value={String(kpis.atRiskCount)}
              icon={<TriangleAlert size={18} />}
            />
          </div>

          <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-4">
            <FilterBar
              chips={chips}
              activeChip={activeFilter}
              onChipChange={(v) => setActiveFilter(v as FilterValue)}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari nama atau kode customer..."
            />
            <div className="mt-4">
              <DataTable
                columns={columns}
                rows={filteredRows}
                rowKey={(row) => row.customer.customer_code}
                onRowClick={(row) => navigate(`/customers/${row.customer.customer_code}`)}
                emptyTitle="Tidak ada customer yang cocok"
                emptyDescription="Coba ubah filter atau kata kunci pencarian."
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
