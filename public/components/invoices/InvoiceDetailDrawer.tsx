import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, Send, TriangleAlert, ShieldAlert } from "lucide-react";
import Drawer from "../ui/Drawer";
import Button from "../ui/Button";
import { StatusBadge, AgingBadge, DisputeStatusBadge } from "../ui/Badge";
import ConfirmationDialog from "../ui/ConfirmationDialog";
import CollectionHistoryList from "../collection/CollectionHistoryList";
import Field from "../ui/Field";
import { useToast } from "../ui/Toast";
import { useARStore } from "../../store/useARStore";
import { useUIStore } from "../../store/useUIStore";
import { getInvoiceContext } from "../../lib/invoiceContext";
import { formatCurrency, formatDate } from "../../lib/format";

interface InvoiceDetailDrawerProps {
  invoiceNumber: string | null;
  onClose: () => void;
}

export default function InvoiceDetailDrawer({ invoiceNumber, onClose }: InvoiceDetailDrawerProps) {
  const navigate = useNavigate();
  const { show } = useToast();
  const { customers, invoices, payments, activities, disputes, setInvoiceEscalated } =
    useARStore();
  const openRecordPayment = useUIStore((s) => s.openRecordPayment);
  const openReminder = useUIStore((s) => s.openReminder);
  const openLogActivity = useUIStore((s) => s.openLogActivity);
  const [escalateConfirm, setEscalateConfirm] = useState(false);

  const context = useMemo(
    () =>
      getInvoiceContext(invoiceNumber, { invoices, customers, payments, activities, disputes }),
    [invoiceNumber, invoices, customers, payments, activities, disputes]
  );

  const handleEscalate = async () => {
    if (!context) return;
    await setInvoiceEscalated(context.invoice.invoice_number, true);
    show(`Invoice ${context.invoice.invoice_number} telah dieskalasi.`, "success");
    setEscalateConfirm(false);
  };

  if (!context) return null;

  return (
    <>
      <Drawer
        open={invoiceNumber !== null}
        onClose={onClose}
        title={context.invoice.invoice_number}
        description={context.customer?.customer_name}
        footer={
          <>
            {context.invoice.outstanding > 0 && (
              <Button
                variant="primary"
                icon={<Banknote size={14} />}
                onClick={() => openRecordPayment(context.invoice.invoice_number)}
              >
                Catat Pembayaran
              </Button>
            )}
            <Button
              variant="secondary"
              icon={<Send size={14} />}
              onClick={() => openReminder(context.invoice.invoice_number)}
            >
              Kirim Pengingat
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <StatusBadge status={context.invoice.status} />
            <AgingBadge bucket={context.invoice.aging_bucket} />
          </div>

          <section className="grid grid-cols-2 gap-4">
            <Field label="Nilai Invoice" value={formatCurrency(context.invoice.amount)} mono />
            <Field label="Outstanding" value={formatCurrency(context.invoice.outstanding)} mono />
            <Field label="Tanggal Invoice" value={formatDate(context.invoice.invoice_date)} />
            <Field label="Jatuh Tempo" value={formatDate(context.invoice.due_date)} />
            <Field label="Collector" value={context.invoice.collector} />
            <Field label="Customer Code" value={context.invoice.customer_code} mono />
          </section>

          {context.dispute && (
            <section className="rounded-[var(--radius-control)] border border-info-text/30 bg-info-bg p-3">
              <div className="flex items-center gap-2 text-info-text">
                <ShieldAlert size={15} />
                <span className="text-sm font-medium">Invoice ini sedang disengketa</span>
              </div>
              <p className="mt-1 text-sm text-brand-950">{context.dispute.dispute_reason}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <DisputeStatusBadge status={context.dispute.status} />
                <button
                  onClick={() => navigate("/ar-management/disputes")}
                  className="text-xs font-medium text-action hover:underline"
                >
                  Buka di Dispute Center
                </button>
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-brand-950">Riwayat Pembayaran</h3>
            {context.payments.length === 0 ? (
              <p className="text-sm text-brand-700">Belum ada pembayaran tercatat.</p>
            ) : (
              <div className="space-y-2">
                {context.payments.map((p) => (
                  <div
                    key={p.payment_id}
                    className="flex items-center justify-between rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-data font-medium text-brand-950">
                        {formatCurrency(p.payment_amount)}
                      </p>
                      <p className="text-xs text-brand-700">
                        {formatDate(p.payment_date)} · {p.payment_method} · {p.reference_number}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-950">Aktivitas Collection</h3>
              <button
                onClick={() => openLogActivity(context.invoice.invoice_number)}
                className="text-xs font-medium text-action hover:underline"
              >
                Catat Aktivitas
              </button>
            </div>
            {context.activities.length === 0 ? (
              <p className="text-sm text-brand-700">Belum ada aktivitas tercatat.</p>
            ) : (
              <CollectionHistoryList activities={context.activities} />
            )}
          </section>

          {context.invoice.status !== "Escalated" && context.invoice.status !== "Paid" && (
            <button
              onClick={() => setEscalateConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-critical px-3 py-2 text-sm font-medium text-critical hover:bg-critical hover:text-white"
            >
              <TriangleAlert size={14} />
              Eskalasi Invoice Ini
            </button>
          )}
        </div>
      </Drawer>

      <ConfirmationDialog
        open={escalateConfirm}
        title={`Eskalasi invoice ${context.invoice.invoice_number}?`}
        description="Invoice akan ditandai sebagai eskalasi dan diteruskan untuk tinjauan manajer/legal."
        confirmLabel="Ya, Eskalasi"
        tone="critical"
        onConfirm={handleEscalate}
        onCancel={() => setEscalateConfirm(false)}
      />
    </>
  );
}
