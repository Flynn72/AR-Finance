import { useEffect, useMemo, useState } from "react";
import { Wallet, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import KPICard from "../../components/ui/KPICard";
import FilterBar from "../../components/ui/FilterBar";
import DataTable, { type DataTableColumn } from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import { StatusBadge, AgingBadge } from "../../components/ui/Badge";
import { LoadingState, ErrorState } from "../../components/ui/StateViews";
import InvoiceDetailDrawer from "../../components/invoices/InvoiceDetailDrawer";
import { useARStore } from "../../store/useARStore";
import { computeDSO } from "../../lib/calculations";
import { formatCurrency, formatCurrencyCompact, formatDateShort } from "../../lib/format";
import type { InvoiceComputed, InvoiceStatus } from "../../types";

type FilterValue = "all" | InvoiceStatus;

const PAGE_SIZE = 10;

export default function Invoices() {
  const { status, error, init, customers, getComputedInvoices } = useARStore();

  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  const computedInvoices = useMemo(
    () => (status === "ready" ? getComputedInvoices() : []),
    [status, getComputedInvoices]
  );

  const customerNameByCode = useMemo(
    () => new Map(customers.map((c) => [c.customer_code, c.customer_name])),
    [customers]
  );

  const kpis = useMemo(() => {
    const totalOutstanding = computedInvoices.reduce((s, i) => s + i.outstanding, 0);
    const totalOverdue = computedInvoices
      .filter((i) => i.status === "Overdue" || i.status === "Escalated")
      .reduce((s, i) => s + i.outstanding, 0);
    const disputedAmount = computedInvoices
      .filter((i) => i.status === "Disputed")
      .reduce((s, i) => s + i.outstanding, 0);
    const disputedCount = computedInvoices.filter((i) => i.status === "Disputed").length;
    const dso = computeDSO(computedInvoices);
    return { totalOutstanding, totalOverdue, disputedAmount, disputedCount, dso };
  }, [computedInvoices]);

  const chips = useMemo(() => {
    const counts: Record<FilterValue, number> = {
      all: computedInvoices.length,
      Unpaid: 0,
      Overdue: 0,
      Paid: 0,
      Disputed: 0,
      Escalated: 0,
    };
    for (const inv of computedInvoices) counts[inv.status]++;

    return [
      { label: "Semua", value: "all", count: counts.all },
      { label: "Belum Jatuh Tempo", value: "Unpaid", count: counts.Unpaid },
      { label: "Overdue", value: "Overdue", count: counts.Overdue },
      { label: "Lunas", value: "Paid", count: counts.Paid },
      { label: "Disengketa", value: "Disputed", count: counts.Disputed },
      { label: "Eskalasi", value: "Escalated", count: counts.Escalated },
    ];
  }, [computedInvoices]);

  const filteredInvoices = useMemo(() => {
    let result = computedInvoices;
    if (activeFilter !== "all") {
      result = result.filter((i) => i.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => {
        const customerName = customerNameByCode.get(i.customer_code)?.toLowerCase() ?? "";
        return i.invoice_number.toLowerCase().includes(q) || customerName.includes(q);
      });
    }
    return result;
  }, [computedInvoices, activeFilter, search, customerNameByCode]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, search]);

  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredInvoices, page]);

  const columns: DataTableColumn<InvoiceComputed>[] = [
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
      render: (row) => (
        <div>
          <p className="font-medium">{customerNameByCode.get(row.customer_code) ?? "-"}</p>
          <p className="font-data text-xs text-brand-700">{row.customer_code}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Nilai Invoice",
      align: "right",
      sortValue: (row) => row.amount,
      render: (row) => <span className="font-data">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "due_date",
      header: "Jatuh Tempo",
      sortValue: (row) => row.due_date,
      render: (row) => <span className="font-data text-sm">{formatDateShort(row.due_date)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "aging",
      header: "Aging",
      sortValue: (row) => row.aging_days,
      render: (row) => <AgingBadge bucket={row.aging_bucket} />,
    },
  ];

  return (
    <AppLayout
      title="AR Management — Invoices"
      description="Kelola seluruh faktur, lacak aging, dan proses pembayaran."
    >
      {status === "loading" || status === "idle" ? (
        <LoadingState label="Memuat data invoice..." />
      ) : status === "error" ? (
        <ErrorState description={error ?? undefined} onRetry={init} />
      ) : (
        <div className="space-y-4">
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
            <KPICard label="Rata-rata DSO" value={`${kpis.dso} Hari`} icon={<Clock size={18} />} />
            <KPICard
              label="Disengketa"
              value={formatCurrencyCompact(kpis.disputedAmount)}
              icon={<ShieldAlert size={18} />}
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
                rows={paginatedInvoices}
                rowKey={(row) => row.invoice_number}
                onRowClick={(row) => setSelectedInvoice(row.invoice_number)}
                selectedRowKey={selectedInvoice}
                emptyTitle="Tidak ada invoice yang cocok"
                emptyDescription="Coba ubah filter atau kata kunci pencarian."
              />
            </div>
            {filteredInvoices.length > 0 && (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filteredInvoices.length}
                onPageChange={setPage}
              />
            )}
          </div>
        </div>
      )}

      <InvoiceDetailDrawer invoiceNumber={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </AppLayout>
  );
}
