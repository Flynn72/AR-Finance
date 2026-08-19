import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, ShieldAlert, TriangleAlert } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import KPICard from "../../components/ui/KPICard";
import FilterBar from "../../components/ui/FilterBar";
import DataTable, { type DataTableColumn } from "../../components/ui/DataTable";
import { DisputeStatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { LoadingState, ErrorState } from "../../components/ui/StateViews";
import ValidateDocumentModal from "../../components/disputes/ValidateDocumentModal";
import { useARStore } from "../../store/useARStore";
import { getDisputeSummary } from "../../lib/dashboardSelectors";
import { formatCurrency, formatCurrencyCompact } from "../../lib/format";
import type { Dispute, DisputeStatus } from "../../types";

type FilterValue = "all" | DisputeStatus;

function daysOpen(dispute: Dispute): number {
  return Math.round(
    (Date.now() - new Date(dispute.created_date).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function DisputeCenter() {
  const { status, error, init, customers, disputes } = useARStore();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  const customerNameByCode = useMemo(
    () => new Map(customers.map((c) => [c.customer_code, c.customer_name])),
    [customers]
  );

  const summary = useMemo(() => getDisputeSummary(disputes), [disputes]);

  const avgResolutionDays = useMemo(() => {
    const resolved = disputes.filter((d) => d.status === "Resolved");
    if (resolved.length === 0) return 0;
    const total = resolved.reduce((sum, d) => sum + daysOpen(d), 0);
    return Math.round(total / resolved.length);
  }, [disputes]);

  const chips = useMemo(() => {
    const counts: Record<FilterValue, number> = {
      all: disputes.length,
      Open: 0,
      "Under Review": 0,
      "Waiting Customer": 0,
      Resolved: 0,
      Rejected: 0,
    };
    for (const d of disputes) counts[d.status]++;
    return [
      { label: "Semua", value: "all", count: counts.all },
      { label: "Baru", value: "Open", count: counts.Open },
      { label: "Ditinjau", value: "Under Review", count: counts["Under Review"] },
      { label: "Menunggu Customer", value: "Waiting Customer", count: counts["Waiting Customer"] },
      { label: "Selesai", value: "Resolved", count: counts.Resolved },
      { label: "Ditolak", value: "Rejected", count: counts.Rejected },
    ];
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    let result = disputes;
    if (activeFilter !== "all") result = result.filter((d) => d.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => {
        const customerName = customerNameByCode.get(d.customer_code)?.toLowerCase() ?? "";
        return d.invoice_number.toLowerCase().includes(q) || customerName.includes(q);
      });
    }
    return [...result].sort((a, b) => b.created_date.localeCompare(a.created_date));
  }, [disputes, activeFilter, search, customerNameByCode]);

  const selectedDispute = disputes.find((d) => d.dispute_id === selectedDisputeId) ?? null;

  const columns: DataTableColumn<Dispute>[] = [
    {
      key: "invoice_number",
      header: "Invoice #",
      sortValue: (row) => row.invoice_number,
      render: (row) => <span className="font-data font-medium text-action">{row.invoice_number}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (row) => customerNameByCode.get(row.customer_code) ?? "",
      render: (row) => customerNameByCode.get(row.customer_code) ?? "-",
    },
    {
      key: "amount",
      header: "Nilai Disengketa",
      align: "right",
      sortValue: (row) => row.amount,
      render: (row) => <span className="font-data">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "reason",
      header: "Alasan",
      render: (row) => row.dispute_reason,
    },
    {
      key: "days",
      header: "Hari Terbuka",
      sortValue: (row) => daysOpen(row),
      render: (row) => (
        <span className={`font-data ${daysOpen(row) > 14 ? "text-critical-text font-medium" : ""}`}>
          {daysOpen(row)} hari
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <DisputeStatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (row) => (
        <Button size="sm" onClick={() => setSelectedDisputeId(row.dispute_id)}>
          Validasi Dokumen
        </Button>
      ),
    },
  ];

  return (
    <AppLayout
      title="Dispute Center"
      description="Tinjau dan selesaikan sengketa invoice pelanggan."
    >
      {status === "loading" || status === "idle" ? (
        <LoadingState label="Memuat data dispute..." />
      ) : status === "error" ? (
        <ErrorState description={error ?? undefined} onRetry={init} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              label="Total Nilai Disengketa"
              value={formatCurrencyCompact(summary.totalDisputedAmount)}
              icon={<ShieldAlert size={18} />}
            />
            <KPICard label="Dispute Aktif" value={String(summary.openCount)} icon={<AlertTriangle size={18} />} />
            <KPICard
              label="Rata-rata Waktu Resolusi"
              value={`${avgResolutionDays} Hari`}
              icon={<Clock size={18} />}
            />
            <KPICard
              label="Perlu Perhatian Segera"
              value={String(summary.urgentCount)}
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
              searchPlaceholder="Cari invoice atau customer..."
            />
            <div className="mt-4">
              <DataTable
                columns={columns}
                rows={filteredDisputes}
                rowKey={(row) => row.dispute_id}
                emptyTitle="Tidak ada dispute yang cocok"
                emptyDescription="Coba ubah filter atau kata kunci pencarian."
              />
            </div>
          </div>
        </div>
      )}

      <ValidateDocumentModal
        dispute={selectedDispute}
        customerName={
          selectedDispute ? customerNameByCode.get(selectedDispute.customer_code) : undefined
        }
        onClose={() => setSelectedDisputeId(null)}
      />
    </AppLayout>
  );
}
