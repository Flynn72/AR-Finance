import { useMemo, useRef, useState } from "react";
import {
  FileSpreadsheet,
  Users,
  ClipboardList,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import clsx from "clsx";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import DataTable, { type DataTableColumn } from "../ui/DataTable";
import { useToast } from "../ui/Toast";
import { useARStore } from "../../store/useARStore";
import { useUIStore } from "../../store/useUIStore";
import {
  IMPORT_DATA_TYPE_LABEL,
  getTemplate,
  buildAutoMapping,
  type ImportDataType,
  type ImportFieldTemplate,
} from "../../lib/importTemplates";
import { downloadImportTemplate } from "../../lib/importTemplateExport";
import { parseSpreadsheetFile, type ParsedSheet } from "../../lib/importParser";
import {
  validateRows,
  toCustomer,
  toInvoice,
  toActivity,
  type ColumnMapping,
  type ValidationSummary,
  type RowValidationResult,
} from "../../lib/importValidation";
import { getRiskLevel } from "../../lib/calculations";

type Step = "select" | "mapping" | "validation" | "preview" | "result";

const DATA_TYPE_OPTIONS: { value: ImportDataType; icon: typeof FileSpreadsheet; description: string }[] = [
  {
    value: "invoices",
    icon: FileSpreadsheet,
    description: "Master data faktur — nomor invoice, customer, nilai, jatuh tempo.",
  },
  {
    value: "customers",
    icon: Users,
    description: "Master data pelanggan — kode, nama, industri, batas kredit.",
  },
  {
    value: "activities",
    icon: ClipboardList,
    description: "Log aktivitas penagihan — telepon, email, follow up, PTP.",
  },
];

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
}

export default function ImportWizardModal() {
  const { importWizardOpen, closeImportWizard } = useUIStore();
  const { customers, invoices, replaceImportedData } = useARStore();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("select");
  const [dataType, setDataType] = useState<ImportDataType | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const template = useMemo(() => (dataType ? getTemplate(dataType) : []), [dataType]);

  const resetAll = () => {
    setStep("select");
    setDataType(null);
    setFileName("");
    setParsed(null);
    setMapping({});
    setParseError(null);
    setValidation(null);
    setResult(null);
  };

  const handleClose = () => {
    closeImportWizard();
    resetAll();
  };

  const handleFileSelected = async (file: File) => {
    if (!dataType) return;
    setParsing(true);
    setParseError(null);
    try {
      const sheet = await parseSpreadsheetFile(file);
      if (sheet.rows.length === 0) {
        setParseError("File tidak berisi data, atau format tidak dikenali.");
        setParsing(false);
        return;
      }
      setParsed(sheet);
      setFileName(file.name);
      setMapping(buildAutoMapping(sheet.headers, getTemplate(dataType)));
      setStep("mapping");
    } catch {
      setParseError("Gagal membaca file. Pastikan formatnya .xlsx, .xls, atau .csv.");
    } finally {
      setParsing(false);
    }
  };

  const handleRunValidation = () => {
    if (!parsed || !dataType) return;
    const summary = validateRows(dataType, parsed.rows, mapping, template, {
      existingCustomerCodes: new Set(customers.map((c) => c.customer_code)),
      existingInvoiceNumbers: new Set(invoices.map((i) => i.invoice_number)),
    });
    setValidation(summary);
    setStep("validation");
  };

  const handleConfirmImport = async () => {
    if (!validation || !dataType) return;
    setImporting(true);

    const validRows = validation.validRows;
    const duplicateAmongValid = validRows.filter((r) => r.isDuplicate).length;

    if (dataType === "customers") {
      const importedCustomers = validRows.map((row) => {
        const riskHeader = mapping.risk_level;
        const rawCell = riskHeader ? parsed?.rows[row.rowIndex]?.[riskHeader] : "";
        const hadExplicitRisk = !!rawCell?.trim();

        const customer = toCustomer(row.data);
        if (!hadExplicitRisk) {
          const existingOutstanding = invoices
            .filter((i) => i.customer_code === customer.customer_code)
            .reduce((sum, i) => sum + Math.max(i.amount - i.paid_amount, 0), 0);
          const utilization =
            customer.credit_limit > 0 ? (existingOutstanding / customer.credit_limit) * 100 : 0;
          customer.risk_level = getRiskLevel(utilization);
        }
        return customer;
      });
      await replaceImportedData({ customers: importedCustomers });
    } else if (dataType === "invoices") {
      const importedInvoices = validRows.map((row) => toInvoice(row.data));
      await replaceImportedData({ invoices: importedInvoices });
    } else {
      const importedActivities = validRows.map((row, idx) => toActivity(row.data, idx));
      await replaceImportedData({ activities: importedActivities });
    }

    setResult({
      imported: validRows.length - duplicateAmongValid,
      updated: duplicateAmongValid,
      skipped: validation.invalidRows.length,
    });
    setImporting(false);
    setStep("result");
    show(`Import ${IMPORT_DATA_TYPE_LABEL[dataType]} selesai.`, "success");
  };

  const modalTitle =
    step === "select"
      ? "Impor Data"
      : `Impor ${dataType ? IMPORT_DATA_TYPE_LABEL[dataType] : ""}`;

  return (
    <Modal open={importWizardOpen} onClose={handleClose} title={modalTitle} size="xl">
      <div className="min-h-[320px]">
        {step === "select" && (
          <SelectStep
            dataType={dataType}
            onSelectType={(t) => {
              setDataType(t);
              setParseError(null);
            }}
            fileInputRef={fileInputRef}
            parsing={parsing}
            parseError={parseError}
            onFileSelected={handleFileSelected}
          />
        )}

        {step === "mapping" && parsed && dataType && (
          <MappingStep
            template={template}
            headers={parsed.headers}
            mapping={mapping}
            onChangeMapping={(key, header) => setMapping((m) => ({ ...m, [key]: header }))}
            fileName={fileName}
            rowCount={parsed.rows.length}
          />
        )}

        {step === "validation" && validation && (
          <ValidationStep validation={validation} />
        )}

        {step === "preview" && validation && (
          <PreviewStep template={template} rows={validation.validRows} />
        )}

        {step === "result" && result && dataType && (
          <ResultStep result={result} dataType={dataType} />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
        <div>
          {step !== "select" && step !== "result" && (
            <Button
              variant="ghost"
              icon={<ArrowLeft size={14} />}
              onClick={() => {
                if (step === "mapping") setStep("select");
                else if (step === "validation") setStep("mapping");
                else if (step === "preview") setStep("validation");
              }}
            >
              Kembali
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {step === "mapping" && (
            <Button variant="primary" onClick={handleRunValidation}>
              Validasi Data
            </Button>
          )}
          {step === "validation" && (
            <Button
              variant="primary"
              disabled={validation?.validRows.length === 0}
              onClick={() => setStep("preview")}
            >
              Lanjut ke Preview
            </Button>
          )}
          {step === "preview" && (
            <Button variant="primary" onClick={handleConfirmImport} disabled={importing}>
              {importing ? "Mengimpor..." : `Konfirmasi Impor (${validation?.validRows.length ?? 0} baris)`}
            </Button>
          )}
          {step === "result" && (
            <>
              <Button variant="secondary" onClick={resetAll}>
                Impor Data Lain
              </Button>
              <Button variant="primary" onClick={handleClose}>
                Selesai
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function SelectStep({
  dataType,
  onSelectType,
  fileInputRef,
  parsing,
  parseError,
  onFileSelected,
}: {
  dataType: ImportDataType | null;
  onSelectType: (t: ImportDataType) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  parsing: boolean;
  parseError: string | null;
  onFileSelected: (file: File) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-brand-950">1. Pilih Jenis Data</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DATA_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelectType(opt.value)}
              className={clsx(
                "rounded-[var(--radius-card)] border p-4 text-left transition-colors",
                dataType === opt.value
                  ? "border-action bg-info-bg"
                  : "border-border-subtle hover:bg-neutral-bg"
              )}
            >
              <opt.icon
                size={18}
                className={dataType === opt.value ? "text-action" : "text-brand-700"}
              />
              <p className="mt-2 text-sm font-medium text-brand-950">
                {IMPORT_DATA_TYPE_LABEL[opt.value]}
              </p>
              <p className="mt-1 text-xs text-brand-700">{opt.description}</p>
            </button>
          ))}
        </div>
        {dataType && (
          <button
            onClick={() => downloadImportTemplate(dataType)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
          >
            <Download size={14} />
            Unduh Template {IMPORT_DATA_TYPE_LABEL[dataType]} (.xlsx)
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-950">2. Unggah File</p>
        <div
          className={clsx(
            "rounded-[var(--radius-card)] border-2 border-dashed p-8 text-center",
            dataType ? "border-border-subtle" : "border-border-subtle/50 opacity-50"
          )}
        >
          <Upload size={22} className="mx-auto text-brand-700" />
          <p className="mt-2 text-sm text-brand-700">
            {parsing ? "Membaca file..." : "Format didukung: .xlsx, .xls, .csv"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={!dataType || parsing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelected(file);
              e.target.value = "";
            }}
          />
          <Button
            className="mt-3"
            size="sm"
            disabled={!dataType || parsing}
            onClick={() => fileInputRef.current?.click()}
          >
            Pilih File
          </Button>
        </div>
        {parseError && <p className="mt-2 text-sm text-critical-text">{parseError}</p>}
      </div>
    </div>
  );
}

function MappingStep({
  template,
  headers,
  mapping,
  onChangeMapping,
  fileName,
  rowCount,
}: {
  template: ImportFieldTemplate[];
  headers: string[];
  mapping: ColumnMapping;
  onChangeMapping: (key: string, header: string | null) => void;
  fileName: string;
  rowCount: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-control)] bg-neutral-bg px-3 py-2.5 text-sm">
        <span className="font-medium text-brand-950">{fileName}</span>
        <span className="text-brand-700"> · {rowCount} baris terdeteksi</span>
      </div>

      <p className="text-sm text-brand-700">
        Cocokkan kolom pada file dengan field yang dibutuhkan sistem. Kolom sudah dipetakan
        otomatis berdasarkan kemiripan nama — silakan sesuaikan jika perlu.
      </p>

      <div className="overflow-hidden rounded-[var(--radius-control)] border border-border-subtle">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-neutral-bg/60 text-xs uppercase text-brand-700">
              <th className="px-3 py-2 text-left">Field Sistem</th>
              <th className="px-3 py-2 text-left">Kolom di File</th>
            </tr>
          </thead>
          <tbody>
            {template.map((field) => (
              <tr key={field.key} className="border-b border-border-subtle last:border-b-0">
                <td className="px-3 py-2">
                  <span className="font-medium text-brand-950">{field.label}</span>
                  {field.required && <span className="ml-1 text-critical-text">*</span>}
                  {field.helpText && (
                    <p className="mt-0.5 text-xs text-brand-700">{field.helpText}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => onChangeMapping(field.key, e.target.value || null)}
                    className="w-full rounded-[var(--radius-control)] border border-border-subtle px-2.5 py-1.5 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
                  >
                    <option value="">— Tidak Dipetakan —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValidationStep({ validation }: { validation: ValidationSummary }) {
  const total = validation.validRows.length + validation.invalidRows.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Total Baris" value={total} />
        <SummaryStat label="Valid" value={validation.validRows.length} tone="success" />
        <SummaryStat label="Bermasalah" value={validation.invalidRows.length} tone="critical" />
        <SummaryStat label="Duplikat" value={validation.duplicateCount} tone="warning" />
      </div>

      {validation.invalidRows.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-brand-950">
            Baris Bermasalah (menampilkan {Math.min(10, validation.invalidRows.length)} dari{" "}
            {validation.invalidRows.length})
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
            {validation.invalidRows.slice(0, 10).map((row) => (
              <div
                key={row.rowIndex}
                className="rounded-[var(--radius-control)] border border-critical/30 bg-critical-bg px-3 py-2 text-sm"
              >
                <p className="font-medium text-critical-text">Baris {row.rowIndex + 2}</p>
                <ul className="mt-1 list-inside list-disc text-xs text-brand-950">
                  {row.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-brand-700">
            Baris bermasalah akan dilewati. Kembali ke langkah Mapping untuk memperbaiki
            pemetaan kolom, atau lanjutkan tanpa baris tersebut.
          </p>
        </div>
      )}

      {validation.duplicateCount > 0 && (
        <p className="rounded-[var(--radius-control)] bg-warning-bg px-3 py-2 text-xs text-warning-text">
          {validation.duplicateCount} baris memiliki kode/nomor yang sudah ada di sistem — data
          yang sudah ada akan diperbarui (bukan diduplikasi).
        </p>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "critical" | "warning";
}) {
  const toneClass: string =
    tone === "success"
      ? "text-success-text"
      : tone === "critical"
      ? "text-critical-text"
      : tone === "warning"
      ? "text-warning-text"
      : "text-brand-950";

  return (
    <div className="rounded-[var(--radius-control)] border border-border-subtle px-3 py-2.5">
      <p className="text-xs text-brand-700">{label}</p>
      <p className={`font-data mt-0.5 text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function PreviewStep({
  template,
  rows,
}: {
  template: ImportFieldTemplate[];
  rows: RowValidationResult[];
}) {
  const columns: DataTableColumn<RowValidationResult>[] = template.map((field) => ({
    key: field.key,
    header: field.label,
    render: (row) => (
      <span className={field.type === "number" ? "font-data" : ""}>
        {row.data[field.key] || "-"}
      </span>
    ),
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-700">
        Menampilkan {Math.min(20, rows.length)} dari {rows.length} baris valid yang akan diimpor.
      </p>
      <div className="max-h-96 overflow-auto scrollbar-thin">
        <DataTable columns={columns} rows={rows.slice(0, 20)} rowKey={(r) => String(r.rowIndex)} />
      </div>
    </div>
  );
}

function ResultStep({ result, dataType }: { result: ImportResult; dataType: ImportDataType }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success-text">
        <CheckCircle2 size={28} />
      </div>
      <div>
        <p className="text-base font-semibold text-brand-950">
          Import {IMPORT_DATA_TYPE_LABEL[dataType]} Selesai
        </p>
        <p className="mt-1 text-sm text-brand-700">
          {result.imported} data baru ditambahkan
          {result.updated > 0 && `, ${result.updated} data diperbarui`}
          {result.skipped > 0 && `, ${result.skipped} baris dilewati karena error`}.
        </p>
      </div>
      {result.skipped > 0 && (
        <div className="flex items-center gap-1.5 rounded-[var(--radius-control)] bg-warning-bg px-3 py-2 text-xs text-warning-text">
          <AlertTriangle size={13} />
          Sebagian baris tidak diimpor — cek kembali file sumber jika diperlukan.
        </div>
      )}
    </div>
  );
}
