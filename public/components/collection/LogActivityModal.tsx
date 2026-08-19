import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { useARStore } from "../../store/useARStore";
import { useUIStore } from "../../store/useUIStore";
import { formatCurrency } from "../../lib/format";
import type { ActivityType } from "../../types";

const ACTIVITY_TYPES: ActivityType[] = [
  "Telepon",
  "Email",
  "WhatsApp",
  "Meeting",
  "Follow Up",
  "Payment Reminder",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function LogActivityModal() {
  const { logActivityOpen, logActivityInvoiceNumber, closeLogActivity } = useUIStore();
  const { customers, invoices, logActivity } = useARStore();
  const { show } = useToast();

  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("Telepon");
  const [activityDate, setActivityDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [isPtp, setIsPtp] = useState(false);
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [promiseDate, setPromiseDate] = useState("");
  const [promiseAmount, setPromiseAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (logActivityOpen) {
      setSelectedInvoiceNumber(logActivityInvoiceNumber);
      setSearch("");
      setActivityType("Telepon");
      setActivityDate(todayISO());
      setNotes("");
      setIsPtp(false);
      setNextFollowUp("");
      setPromiseDate("");
      setPromiseAmount("");
    }
  }, [logActivityOpen, logActivityInvoiceNumber]);

  const selectedInvoice = useMemo(
    () => invoices.find((i) => i.invoice_number === selectedInvoiceNumber) ?? null,
    [invoices, selectedInvoiceNumber]
  );
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customer_code === selectedInvoice?.customer_code),
    [customers, selectedInvoice]
  );

  useEffect(() => {
    if (selectedInvoice) {
      setPromiseAmount(String(selectedInvoice.amount - selectedInvoice.paid_amount));
    }
  }, [selectedInvoice?.invoice_number]); // eslint-disable-line react-hooks/exhaustive-deps

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
    closeLogActivity();
    setSelectedInvoiceNumber(null);
  };

  const handleSubmit = async () => {
    if (!selectedInvoice) return;
    if (!notes.trim()) {
      show("Catatan aktivitas wajib diisi.", "error");
      return;
    }
    if (isPtp && (!promiseDate || !promiseAmount)) {
      show("Tanggal dan jumlah janji bayar wajib diisi untuk PTP.", "error");
      return;
    }

    setSubmitting(true);
    await logActivity({
      activity_id: `ACT-${Date.now()}`,
      customer_code: selectedInvoice.customer_code,
      invoice_number: selectedInvoice.invoice_number,
      activity_type: activityType,
      activity_date: activityDate,
      notes: notes.trim(),
      collector: "Anda",
      next_follow_up: nextFollowUp || undefined,
      is_ptp: isPtp,
      promise_payment_date: isPtp ? promiseDate : undefined,
      promise_amount: isPtp ? Number(promiseAmount) : undefined,
    });
    setSubmitting(false);
    show("Aktivitas berhasil dicatat.", "success");
    handleClose();
  };

  return (
    <Modal
      open={logActivityOpen}
      onClose={handleClose}
      title="Catat Aktivitas"
      description="Dokumentasikan interaksi penagihan dengan customer."
      size="lg"
      footer={
        selectedInvoice && (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Aktivitas"}
            </Button>
          </>
        )
      }
    >
      {!selectedInvoice ? (
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
          <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-neutral-bg px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-brand-950">{selectedCustomer?.customer_name}</p>
              <p className="font-data text-xs text-brand-700">{selectedInvoice.invoice_number}</p>
            </div>
            {!logActivityInvoiceNumber && (
              <button
                onClick={() => setSelectedInvoiceNumber(null)}
                className="text-xs font-medium text-action hover:underline"
              >
                Ganti Invoice
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">Jenis Aktivitas</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">Tanggal Aktivitas</label>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-brand-700">Catatan Hasil Interaksi</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Contoh: Customer mengonfirmasi akan membayar minggu depan."
              className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-brand-700">
              Tanggal Follow Up Berikutnya (opsional)
            </label>
            <input
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
            />
          </div>

          <label className="flex items-center gap-2 rounded-[var(--radius-control)] border border-border-subtle px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={isPtp}
              onChange={(e) => setIsPtp(e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle accent-action"
            />
            <span className="font-medium text-brand-950">Set Promise to Pay (PTP)</span>
          </label>

          {isPtp && (
            <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-control)] bg-warning-bg/50 p-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-700">
                  Tanggal Janji Bayar
                </label>
                <input
                  type="date"
                  value={promiseDate}
                  onChange={(e) => setPromiseDate(e.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-700">
                  Jumlah Janji Bayar
                </label>
                <input
                  type="number"
                  value={promiseAmount}
                  onChange={(e) => setPromiseAmount(e.target.value)}
                  className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm font-data focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
