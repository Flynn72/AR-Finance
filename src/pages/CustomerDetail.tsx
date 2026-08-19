import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Banknote } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import ProgressBar from "../components/ui/ProgressBar";
import DataTable, { type DataTableColumn } from "../components/ui/DataTable";
import { StatusBadge, AgingBadge, RiskBadge } from "../components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/StateViews";
import CollectionHistoryList from "../components/collection/CollectionHistoryList";
import InvoiceDetailDrawer from "../components/invoices/InvoiceDetailDrawer";
import { useARStore } from "../store/useARStore";
import { useUIStore } from "../store/useUIStore";
import { computeCustomerSummary, computeDSO } from "../lib/calculations";
import { formatCurrency, formatDateShort, formatPercent } from "../lib/format";
import type { InvoiceComputed, Payment } from "../types";

type Tab = "invoices" | "payments" | "activities";

export default function CustomerDetail() {
  const { customerCode } = useParams();
  const navigate = useNavigate();
  const { status, error, init, customers, payments, activities, getComputedInvoices } =
    useARStore();
  const openRecordPayment = useUIStore((s) => s.openRecordPayment);

  const [tab, setTab] = useState<Tab>("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  const customer = customers.find((c) => c.customer_code === customerCode);

  const customerInvoices = useMemo(() => {
    if (status !== "ready" || !customerCode) return [];
    return getComputedInvoices().filter((inv) => inv.customer_code === customerCode);
  }, [status, customerCode, getComputedInvoices]);

  const customerPayments = useMemo(
    () => payments.filter((p) => p.customer_code === customerCode)
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date)),
    [payments, customerCode]
  );

  const customerActivities = useMemo(
    () => activities.filter((a) => a.customer_code === customerCode)
      .sort((a, b) => b.activity_date.localeCompare(a.activity_date)),
    [activities, customerCode]
  );

  const summary = useMemo(
    () => (customer ? computeCustomerSummary(customer, customerInvoices) : null),
    [customer, customerInvoices]
  );

  const dso = useMemo(() => computeDSO(customerInvoices), [customerInvoices]);

  const invoiceColumns: DataTableColumn<InvoiceComputed>[] = [
    {
      key: "invoice_number",
      header: "Invoice #",
      sortValue: (row) => row.invoice_number,
      render: (row) => <span className="font-data font-medium text-action">{row.invoice_number}</span>,
    },
    {
      key: "amount",
      header: "Nilai",
      align: "right",
      sortValue: (row) => row.amount,
      render: (row) => <span className="font-data">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      sortValue: (row) => row.outstanding,
      render: (row) => <span className="font-data">{formatCurrency(row.outstanding)}</span>,
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

  const paymentColumns: DataTableColumn<Payment>[] = [
    {
      key: "date",
      header: "Tanggal",
      sortValue: (row) => row.payment_date,
      render: (row) => <span className="font-data text-sm">{formatDateShort(row.payment_date)}</span>,
    },
    {
      key: "invoice",
      header: "Invoice #",
      sortValue: (row) => row.invoice_number,
      render: (row) => <span className="font-data">{row.invoice_number}</span>,
    },
    {
      key: "amount",
      header: "Jumlah",
      align: "right",
      sortValue: (row) => row.payment_amount,
      render: (row) => <span className="font-data">{formatCurrency(row.payment_amount)}</span>,
    },
    {
      key: "method",
      header: "Metode",
      render: (row) => row.payment_method,
    },
    {
      key: "reference",
      header: "Referensi",
      render: (row) => <span className="font-data text-xs">{row.reference_number}</span>,
    },
  ];

  if (status === "loading" || status === "idle") {
    return (
      <AppLayout title="Detail Customer">
        <LoadingState label="Memuat data customer..." />
      </AppLayout>
    );
  }

  if (status === "error") {
    return (
      <AppLayout title="Detail Customer">
        <ErrorState description={error ?? undefined} onRetry={init} />
      </AppLayout>
    );
  }

  if (!customer || !summary) {
    return (
      <AppLayout title="Detail Customer">
        <EmptyState
          title="Customer tidak ditemukan"
          description={`Tidak ada data untuk kode customer "${customerCode}".`}
          action={
            <Button size="sm" onClick={() => navigate("/customers")}>
              Kembali ke Directory
            </Button>
          }
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={customer.customer_name}
      description={`${customer.customer_code} · ${customer.industry}`}
      actions={
        <>
          <Button
            variant="secondary"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate("/customers")}
          >
            Directory
          </Button>
          {summary.outstanding > 0 && (
            <Button
              variant="primary"
              icon={<Banknote size={14} />}
              onClick={() => openRecordPayment()}
            >
              Catat Pembayaran
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5 lg:col-span-2">
            <div className="flex items-center gap-2">
              <RiskBadge level={customer.risk_level} />
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  customer.status === "Active"
                    ? "bg-success-bg text-success-text"
                    : "bg-neutral-bg text-neutral-text"
                }`}
              >
                {customer.status === "Active" ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Total Outstanding" value={formatCurrency(summary.outstanding)} mono />
              <Field label="Total Overdue" value={formatCurrency(summary.overdue)} mono />
              <Field label="Total Terbayar" value={formatCurrency(summary.paid)} mono />
              <Field label="Rata-rata DSO" value={`${dso} Hari`} mono />
              <Field label="Jumlah Invoice" value={String(customerInvoices.length)} mono />
              <Field label="Kontak" value={customer.contact} />
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
            <p className="text-sm font-semibold text-brand-950">Credit Control</p>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="font-data text-xl font-semibold text-brand-950">
                  {formatPercent(summary.credit_utilization, 0)}
                </span>
                <span className="text-xs text-brand-700">terpakai</span>
              </div>
              <ProgressBar value={summary.credit_utilization} className="mt-2" />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-700">Batas Kredit</span>
                <span className="font-data font-medium">{formatCurrency(customer.credit_limit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-700">Sisa Kredit Tersedia</span>
                <span className="font-data font-medium">
                  {formatCurrency(Math.max(customer.credit_limit - summary.outstanding, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-4">
          <div className="flex gap-1 border-b border-border-subtle pb-3">
            <TabButton active={tab === "invoices"} onClick={() => setTab("invoices")}>
              Riwayat Invoice ({customerInvoices.length})
            </TabButton>
            <TabButton active={tab === "payments"} onClick={() => setTab("payments")}>
              Riwayat Pembayaran ({customerPayments.length})
            </TabButton>
            <TabButton active={tab === "activities"} onClick={() => setTab("activities")}>
              Riwayat Aktivitas ({customerActivities.length})
            </TabButton>
          </div>

          <div className="mt-4">
            {tab === "invoices" && (
              <DataTable
                columns={invoiceColumns}
                rows={customerInvoices}
                rowKey={(row) => row.invoice_number}
                onRowClick={(row) => setSelectedInvoice(row.invoice_number)}
                emptyTitle="Belum ada invoice untuk customer ini"
              />
            )}
            {tab === "payments" && (
              <DataTable
                columns={paymentColumns}
                rows={customerPayments}
                rowKey={(row) => row.payment_id}
                emptyTitle="Belum ada pembayaran tercatat"
              />
            )}
            {tab === "activities" && (
              <CollectionHistoryList
                activities={customerActivities}
                showContext
                emptyDescription="Belum ada aktivitas collection untuk customer ini."
              />
            )}
          </div>
        </div>
      </div>

      <InvoiceDetailDrawer invoiceNumber={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </AppLayout>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-brand-950 text-white" : "text-brand-700 hover:bg-neutral-bg"
      }`}
    >
      {children}
    </button>
  );
}
