import { useState } from "react";
import { Phone, Send, TriangleAlert, Banknote } from "lucide-react";
import DataTable, { type DataTableColumn } from "../ui/DataTable";
import Button from "../ui/Button";
import { StatusBadge } from "../ui/Badge";
import ConfirmationDialog from "../ui/ConfirmationDialog";
import { useToast } from "../ui/Toast";
import { useARStore } from "../../store/useARStore";
import { useUIStore } from "../../store/useUIStore";
import { useNavigate } from "react-router-dom";
import type { OverdueRow } from "../../lib/dashboardSelectors";
import { formatCurrency, formatDateShort } from "../../lib/format";

export default function HighPriorityOverdueWidget({ rows }: { rows: OverdueRow[] }) {
  const navigate = useNavigate();
  const { show } = useToast();
  const setInvoiceEscalated = useARStore((s) => s.setInvoiceEscalated);
  const openReminder = useUIStore((s) => s.openReminder);
  const openRecordPayment = useUIStore((s) => s.openRecordPayment);
  const openLogActivity = useUIStore((s) => s.openLogActivity);
  const [escalateTarget, setEscalateTarget] = useState<string | null>(null);

  const handleEscalate = async () => {
    if (!escalateTarget) return;
    await setInvoiceEscalated(escalateTarget, true);
    show(`Invoice ${escalateTarget} telah dieskalasi.`, "success");
    setEscalateTarget(null);
  };

  const columns: DataTableColumn<OverdueRow>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <div>
          <p className="font-medium">{row.customer?.customer_name ?? "-"}</p>
          <p className="font-data text-xs text-brand-700">{row.invoice.invoice_number}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Outstanding",
      align: "right",
      sortValue: (row) => row.invoice.outstanding,
      render: (row) => <span className="font-data">{formatCurrency(row.invoice.outstanding)}</span>,
    },
    {
      key: "due",
      header: "Jatuh Tempo",
      sortValue: (row) => row.invoice.due_date,
      render: (row) => (
        <div>
          <p className="font-data text-sm">{formatDateShort(row.invoice.due_date)}</p>
          <p className="text-xs text-critical-text">{row.invoice.aging_days} hari terlambat</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.invoice.status} />,
    },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<Phone size={13} />}
            onClick={() => openLogActivity(row.invoice.invoice_number)}
          >
            Log Call
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Banknote size={13} />}
            onClick={() => openRecordPayment(row.invoice.invoice_number)}
          >
            Bayar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Send size={13} />}
            onClick={() => openReminder(row.invoice.invoice_number)}
          >
            Kirim Pengingat
          </Button>
          {row.invoice.status !== "Escalated" && (
            <Button
              size="sm"
              variant="critical"
              icon={<TriangleAlert size={13} />}
              onClick={() => setEscalateTarget(row.invoice.invoice_number)}
            >
              Eskalasi
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-950">High Priority Overdue</h3>
        <button
          onClick={() => navigate("/ar-management/invoices")}
          className="text-xs font-medium text-action hover:underline"
        >
          Lihat Semua
        </button>
      </div>
      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.invoice.invoice_number}
          emptyTitle="Tidak ada invoice overdue prioritas tinggi"
          emptyDescription="Semua piutang dalam kondisi terkendali."
        />
      </div>

      <ConfirmationDialog
        open={escalateTarget !== null}
        title={`Eskalasi invoice ${escalateTarget}?`}
        description="Invoice akan ditandai sebagai eskalasi dan diteruskan untuk tinjauan manajer/legal."
        confirmLabel="Ya, Eskalasi"
        tone="critical"
        onConfirm={handleEscalate}
        onCancel={() => setEscalateTarget(null)}
      />
    </div>
  );
}
