import { useEffect, useMemo, useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import clsx from "clsx";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { useARStore } from "../../store/useARStore";
import { useUIStore } from "../../store/useUIStore";
import { getInvoiceContext } from "../../lib/invoiceContext";
import { formatCurrency, formatDate } from "../../lib/format";

type Channel = "Email" | "WhatsApp";

function buildMessage(channel: Channel, customerName: string, invoiceNumber: string, amount: string, dueDate: string, agingDays: number) {
  const greeting = channel === "Email" ? `Yth. Bapak/Ibu ${customerName},` : `Halo ${customerName},`;
  const overdueLine =
    agingDays > 0
      ? `Invoice ini telah melewati jatuh tempo selama ${agingDays} hari.`
      : `Invoice ini akan segera jatuh tempo.`;

  return `${greeting}

Kami ingin mengingatkan mengenai invoice ${invoiceNumber} dengan outstanding sebesar ${amount}, jatuh tempo pada ${dueDate}. ${overdueLine}

Mohon konfirmasi rencana pembayaran Anda agar dapat segera kami proses. Terima kasih atas perhatian dan kerja sama Anda.

Hormat kami,
Tim Finance`;
}

export default function SendReminderModal() {
  const { reminderOpen, reminderInvoiceNumber, closeReminder } = useUIStore();
  const { customers, invoices, payments, activities, disputes, logActivity } = useARStore();
  const { show } = useToast();

  const [channel, setChannel] = useState<Channel>("Email");
  const [sending, setSending] = useState(false);

  const context = useMemo(
    () =>
      getInvoiceContext(reminderInvoiceNumber, { invoices, customers, payments, activities, disputes }),
    [reminderInvoiceNumber, invoices, customers, payments, activities, disputes]
  );

  useEffect(() => {
    if (reminderOpen) setChannel("Email");
  }, [reminderOpen]);

  if (!context) {
    return <Modal open={reminderOpen} onClose={closeReminder} title="Kirim Pengingat"><></></Modal>;
  }

  const message = buildMessage(
    channel,
    context.customer?.customer_name ?? "-",
    context.invoice.invoice_number,
    formatCurrency(context.invoice.outstanding),
    formatDate(context.invoice.due_date),
    context.invoice.aging_days
  );

  const handleSend = async () => {
    setSending(true);
    await logActivity({
      activity_id: `ACT-${Date.now()}`,
      customer_code: context.invoice.customer_code,
      invoice_number: context.invoice.invoice_number,
      activity_type: "Payment Reminder",
      activity_date: new Date().toISOString().slice(0, 10),
      notes: `Pengingat pembayaran dikirim via ${channel} (simulasi).`,
      collector: "Sistem",
      is_ptp: false,
    });
    setSending(false);
    show(`Pengingat via ${channel} berhasil dikirim (simulasi).`, "success");
    closeReminder();
  };

  return (
    <Modal
      open={reminderOpen}
      onClose={closeReminder}
      title="Kirim Pengingat"
      description={`${context.customer?.customer_name} · ${context.invoice.invoice_number}`}
      footer={
        <>
          <Button variant="ghost" onClick={closeReminder}>
            Batal
          </Button>
          <Button variant="primary" icon={<Send size={14} />} onClick={handleSend} disabled={sending}>
            {sending ? "Mengirim..." : "Kirim Sekarang"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setChannel("Email")}
            className={clsx(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium",
              channel === "Email"
                ? "border-action bg-info-bg text-info-text"
                : "border-border-subtle text-brand-700 hover:bg-neutral-bg"
            )}
          >
            <Mail size={14} /> Email
          </button>
          <button
            onClick={() => setChannel("WhatsApp")}
            className={clsx(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium",
              channel === "WhatsApp"
                ? "border-action bg-info-bg text-info-text"
                : "border-border-subtle text-brand-700 hover:bg-neutral-bg"
            )}
          >
            <MessageCircle size={14} /> WhatsApp
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-brand-700">
            Pratinjau Pesan
          </label>
          <textarea
            readOnly
            value={message}
            rows={9}
            className="w-full rounded-[var(--radius-control)] border border-border-subtle bg-neutral-bg/40 px-3 py-2 text-sm text-brand-950"
          />
        </div>
        <p className="text-xs text-brand-700">
          Pengiriman email/WhatsApp aktual memerlukan integrasi pihak ketiga — pada tahap ini
          pengiriman disimulasikan dan tercatat sebagai aktivitas collection.
        </p>
      </div>
    </Modal>
  );
}
