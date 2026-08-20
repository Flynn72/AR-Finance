import { useState } from "react";
import { DatabaseZap, Upload, Download, FileSpreadsheet, Users, ClipboardList } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components/ui/Button";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";
import { useToast } from "../components/ui/Toast";
import { useARStore } from "../store/useARStore";
import { useUIStore } from "../store/useUIStore";
import {
  IMPORT_DATA_TYPE_LABEL,
  getTemplate,
  type ImportDataType,
} from "../lib/importTemplates";
import { downloadImportTemplate } from "../lib/importTemplateExport";

const TEMPLATE_CARDS: { value: ImportDataType; icon: typeof FileSpreadsheet }[] = [
  { value: "customers", icon: Users },
  { value: "invoices", icon: FileSpreadsheet },
  { value: "activities", icon: ClipboardList },
];

export default function Settings() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const resetToMockData = useARStore((s) => s.resetToMockData);
  const openImportWizard = useUIStore((s) => s.openImportWizard);
  const { show } = useToast();

  const handleReset = async () => {
    setConfirmOpen(false);
    await resetToMockData();
    show("Data Anda berhasil direset ke data contoh.", "success");
  };

  return (
    <AppLayout
      title="Settings & Data Management"
      description="Kelola sumber data aplikasi dan preferensi sistem."
    >
      <div className="space-y-6">
        <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-info-bg text-info-text">
              <Upload size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-950">Impor Data dari Excel/CSV</p>
              <p className="mt-1 text-sm text-brand-700">
                Perbarui data aplikasi lewat file Excel atau CSV — untuk Master Customers, Master
                Invoices, atau Collection Activity. Unduh template di bawah, isi datanya, lalu
                mulai import — sistem akan memandu pemetaan kolom, validasi, dan pratinjau
                sebelum data disimpan.
              </p>
              <p className="mt-2 text-xs text-brand-700">
                Urutan import yang disarankan: <strong>Customers → Invoices → Activity</strong>{" "}
                (invoice butuh kode customer yang sudah ada, aktivitas butuh keduanya).
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="primary"
                icon={<Upload size={14} />}
                onClick={openImportWizard}
              >
                Mulai Import
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border-subtle pt-4 sm:grid-cols-3">
            {TEMPLATE_CARDS.map(({ value, icon: Icon }) => {
              const template = getTemplate(value);
              const requiredFields = template.filter((f) => f.required).map((f) => f.label);
              return (
                <div
                  key={value}
                  className="flex flex-col rounded-[var(--radius-control)] border border-border-subtle p-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-brand-700" />
                    <span className="text-xs font-medium text-brand-950">
                      {IMPORT_DATA_TYPE_LABEL[value]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-brand-700">
                    Wajib: {requiredFields.join(", ")}
                  </p>
                  <button
                    onClick={() => downloadImportTemplate(value)}
                    className="mt-2 inline-flex items-center gap-1 self-start text-xs font-medium text-action hover:underline"
                  >
                    <Download size={12} />
                    Unduh Template
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {import.meta.env.DEV && (
          <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-neutral-bg text-brand-700">
                <DatabaseZap size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-brand-950">Data Contoh (Development)</p>
                <p className="mt-1 text-sm text-brand-700">
                  Setiap akun punya datanya masing-masing (privat, tidak dibagi ke user lain).
                  Tombol ini hanya tersedia di mode development dan akan mengganti{" "}
                  <strong>data milik akun Anda sendiri</strong> dengan data contoh — tidak
                  memengaruhi data user lain. Tidak muncul di build produksi.
                </p>
                <Button className="mt-3" size="sm" onClick={() => setConfirmOpen(true)}>
                  Reset ke Data Contoh
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        title="Reset seluruh data?"
        description="Semua data invoice, payment, aktivitas, dan dispute milik akun Anda saat ini akan diganti dengan data contoh. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Reset Data"
        tone="critical"
        onConfirm={handleReset}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppLayout>
  );
}
