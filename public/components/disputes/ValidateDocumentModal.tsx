import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { useARStore } from "../../store/useARStore";
import { formatCurrency, formatDate } from "../../lib/format";
import type { Dispute, DisputeStatus } from "../../types";

const NEXT_STATUS_OPTIONS: DisputeStatus[] = [
  "Open",
  "Under Review",
  "Waiting Customer",
  "Resolved",
  "Rejected",
];

const STATUS_LABEL: Record<DisputeStatus, string> = {
  Open: "Baru Dibuka",
  "Under Review": "Sedang Ditinjau",
  "Waiting Customer": "Menunggu Customer",
  Resolved: "Terselesaikan",
  Rejected: "Ditolak",
};

interface ValidateDocumentModalProps {
  dispute: Dispute | null;
  invoiceNumber?: string;
  customerName?: string;
  onClose: () => void;
}

export default function ValidateDocumentModal({
  dispute,
  customerName,
  onClose,
}: ValidateDocumentModalProps) {
  const upsertDispute = useARStore((s) => s.upsertDispute);
  const { show } = useToast();
  const [nextStatus, setNextStatus] = useState<DisputeStatus>("Under Review");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!dispute) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    await upsertDispute({ ...dispute, status: nextStatus });
    setSubmitting(false);
    show(`Status dispute ${dispute.invoice_number} diperbarui menjadi "${STATUS_LABEL[nextStatus]}".`, "success");
    setNotes("");
    onClose();
  };

  return (
    <Modal
      open={dispute !== null}
      onClose={onClose}
      title="Validasi Dokumen Dispute"
      description={`${customerName ?? dispute.customer_code} · ${dispute.invoice_number}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Menyimpan..." : "Perbarui Status"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[var(--radius-control)] bg-neutral-bg px-3 py-2.5 text-sm">
          <p className="font-medium text-brand-950">{dispute.dispute_reason}</p>
          <p className="mt-1 text-xs text-brand-700">
            Nilai disengketa: <span className="font-data font-medium">{formatCurrency(dispute.amount)}</span>
            {" · "}Dibuka {formatDate(dispute.created_date)} · PIC: {dispute.assigned_to}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-brand-700">
            Status Setelah Validasi
          </label>
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as DisputeStatus)}
            className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
          >
            {NEXT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-brand-700">
            Catatan Validasi (opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Contoh: Bukti pengiriman sudah diterima dan sesuai."
            className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
          />
        </div>
      </div>
    </Modal>
  );
}
