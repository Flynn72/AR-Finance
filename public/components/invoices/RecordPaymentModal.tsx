import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { useARStore } from "../../store/useARStore";
import { useUIStore } from "../../store/useUIStore";
import { getInvoiceContext } from "../../lib/invoiceContext";
import { formatCurrency, formatDate } from "../../lib/format";
import type { PaymentMethod } from "../../types";

const PAYMENT_METHODS: PaymentMethod[] = ["Transfer Bank", "Giro", "Cek", "Tunai", "Lainnya"];

export default function RecordPaymentModal() {
  const { recordPaymentOpen, recordPaymentInvoiceNumber, closeRecordPayment } = useUIStore();
  const { customers, invoices, payments, activities, disputes, recordPayment } = useARStore();
  const { show } = useToast();

  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>("Transfer Bank");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (recordPaymentOpen) {
      setSelectedInvoiceNumber(recordPaymentInvoiceNumber);
      setSearch("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setMethod("Transfer Bank");
      setReference("");
      setNotes("");
    }
  }, [recordPaymentOpen, recordPaymentInvoiceNumber]);

  const context = useMemo(
    () =>
      getInvoiceContext(selectedInvoiceNumber, {
        invoices,
        customers,
        payments,
        activities,
        disputes,
      }),
    [selectedInvoiceNumber, invoices, customers, payments, activities, disputes]
  );

  useEffect(() => {
    if (context) setAmount(String(context.invoice.outstanding));
  }, [context?.invoice.invoice_number]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return invoices
      .filter((inv) => inv.amount - inv.paid_amount > 0)
      .filter((inv) => {
        const customer = customers.find((c) => c.customer_code === inv.customer_code);
        return (
          inv.invoice_number.toLowerCase().includes(q) ||
          customer?.customer_name.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [search, invoices, customers]);

  const handleClose = () => {
    closeRecordPayment();
    setSelectedInvoiceNumber(null);
  };

  const handleSubmit = async () => {
    if (!context) return;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      show("Jumlah pembayaran harus lebih dari 0.", "error");
      return;
    }
    if (numericAmount > context.invoice.outstanding) {
      show("Jumlah pembayaran melebihi outstanding invoice.", "error");
      return;
    }
    if (!reference.trim()) {
      show("Nomor referensi pembayaran wajib diisi.", "error");
      return;
    }

    setSubmitting(true);
    await recordPayment({
      payment_id: `PAY-${Date.now()}`,
      invoice_number: context.invoice.invoice_number,
      customer_code: context.invoice.customer_code,
      payment_date: paymentDate,
      payment_amount: numericAmount,
      payment_method: method,
      reference_number: reference.trim(),
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);
    show(`Pembayaran untuk ${context.invoice.invoice_number} berhasil dicatat.`, "success");
    handleClose();
  };

  return (
    <Modal
      open={recordPaymentOpen}
      onClose={handleClose}
      title="Catat Pembayaran"
      description="Cocokkan pembayaran kas masuk dengan nomor faktur."
      footer={
        context && (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </>
        )
      }
    >
      {!context ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-brand-950">
            Cari Invoice atau Customer
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-700"
            />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Contoh: INV-2026-1024 atau Nusantara Logistik"
              className="w-full rounded-[var(--radius-control)] border border-border-subtle py-2 pl-8 pr-3 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
            />
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
            {searchResults.map((inv) => {
              const customer = customers.find((c) => c.customer_code === inv.customer_code);
              return (
                <button
                  key={inv.invoice_number}
                  onClick={() => setSelectedInvoiceNumber(inv.invoice_number)}
                  className="flex w-full items-center justify-between rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-left text-sm hover:bg-neutral-bg"
                >
                  <div>
                    <p className="font-medium text-brand-950">{customer?.customer_name}</p>
                    <p className="font-data text-xs text-brand-700">{inv.invoice_number}</p>
                  </div>
                  <span className="font-data text-sm">
                    {formatCurrency(inv.amount - inv.paid_amount)}
                  </span>
                </button>
              );
            })}
            {search.trim() && searchResults.length === 0 && (
              <p className="py-4 text-center text-sm text-brand-700">
                Tidak ditemukan invoice yang cocok.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-control)] bg-neutral-bg px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-950">{context.customer?.customer_name}</p>
                <p className="font-data text-xs text-brand-700">{context.invoice.invoice_number}</p>
              </div>
              {!recordPaymentInvoiceNumber && (
                <button
                  onClick={() => setSelectedInvoiceNumber(null)}
                  className="text-xs font-medium text-action hover:underline"
                >
                  Ganti Invoice
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-brand-700">
              Outstanding: <span className="font-data font-medium text-brand-950">{formatCurrency(context.invoice.outstanding)}</span>
              {" · "}Jatuh tempo {formatDate(context.invoice.due_date)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">
                Jumlah Pembayaran
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={context.invoice.outstanding}
                min={0}
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm font-data focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">
                Tanggal Pembayaran
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">
                Metode Pembayaran
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">
                Nomor Referensi
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Contoh: REF123456"
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-brand-700">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
