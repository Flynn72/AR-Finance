export type ImportDataType = "invoices" | "customers" | "activities";

export type FieldType = "string" | "number" | "date" | "boolean" | "enum";

export interface ImportFieldTemplate {
  key: string;
  label: string;
  required: boolean;
  type: FieldType;
  enumValues?: string[];
  defaultValue?: string;
  helpText?: string;
}

export const IMPORT_DATA_TYPE_LABEL: Record<ImportDataType, string> = {
  invoices: "Master Invoices",
  customers: "Master Customers",
  activities: "Collection Activity",
};

export const INVOICE_TEMPLATE: ImportFieldTemplate[] = [
  { key: "invoice_number", label: "Nomor Invoice", required: true, type: "string" },
  { key: "customer_code", label: "Kode Customer", required: true, type: "string" },
  { key: "invoice_date", label: "Tanggal Invoice", required: true, type: "date" },
  { key: "due_date", label: "Tanggal Jatuh Tempo", required: true, type: "date" },
  { key: "amount", label: "Nilai Invoice", required: true, type: "number" },
  { key: "paid_amount", label: "Jumlah Terbayar", required: false, type: "number", defaultValue: "0" },
  { key: "collector", label: "Collector", required: false, type: "string", defaultValue: "-" },
  {
    key: "is_escalated",
    label: "Status Eskalasi",
    required: false,
    type: "boolean",
    defaultValue: "false",
  },
];

export const CUSTOMER_TEMPLATE: ImportFieldTemplate[] = [
  { key: "customer_code", label: "Kode Customer", required: true, type: "string" },
  { key: "customer_name", label: "Nama Customer", required: true, type: "string" },
  { key: "industry", label: "Industri", required: true, type: "string" },
  { key: "contact", label: "Kontak", required: false, type: "string", defaultValue: "-" },
  { key: "credit_limit", label: "Batas Kredit", required: true, type: "number" },
  {
    key: "risk_level",
    label: "Risk Level",
    required: false,
    type: "enum",
    enumValues: ["Low", "Medium", "High", "Critical"],
    defaultValue: "Low",
    helpText: "Kosongkan untuk dihitung otomatis dari credit utilization.",
  },
  {
    key: "status",
    label: "Status",
    required: false,
    type: "enum",
    enumValues: ["Active", "Inactive"],
    defaultValue: "Active",
  },
];

export const ACTIVITY_TEMPLATE: ImportFieldTemplate[] = [
  { key: "customer_code", label: "Kode Customer", required: true, type: "string" },
  { key: "invoice_number", label: "Nomor Invoice", required: true, type: "string" },
  {
    key: "activity_type",
    label: "Jenis Aktivitas",
    required: true,
    type: "enum",
    enumValues: ["Telepon", "Email", "WhatsApp", "Meeting", "Follow Up", "Payment Reminder"],
  },
  { key: "activity_date", label: "Tanggal Aktivitas", required: true, type: "date" },
  { key: "notes", label: "Catatan", required: true, type: "string" },
  { key: "collector", label: "Collector", required: false, type: "string", defaultValue: "-" },
  { key: "next_follow_up", label: "Tanggal Follow Up", required: false, type: "date" },
  {
    key: "is_ptp",
    label: "Promise to Pay",
    required: false,
    type: "boolean",
    defaultValue: "false",
  },
  { key: "promise_payment_date", label: "Tanggal Janji Bayar", required: false, type: "date" },
  { key: "promise_amount", label: "Jumlah Janji Bayar", required: false, type: "number" },
];

export function getTemplate(dataType: ImportDataType): ImportFieldTemplate[] {
  switch (dataType) {
    case "invoices":
      return INVOICE_TEMPLATE;
    case "customers":
      return CUSTOMER_TEMPLATE;
    case "activities":
      return ACTIVITY_TEMPLATE;
  }
}

/** Normalisasi header untuk auto-suggest mapping kolom (lowercase, buang spasi/underscore/simbol). */
export function normalizeHeader(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Auto-suggest pemetaan kolom file -> field template, berdasarkan kemiripan nama header. */
export function buildAutoMapping(
  headers: string[],
  template: ImportFieldTemplate[]
): Record<string, string | null> {
  const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }));
  const mapping: Record<string, string | null> = {};

  for (const field of template) {
    const normKey = normalizeHeader(field.key);
    const normLabel = normalizeHeader(field.label);
    const exact = normalizedHeaders.find(
      (h) => h.normalized === normKey || h.normalized === normLabel
    );
    const partial = normalizedHeaders.find(
      (h) => h.normalized.includes(normKey) || normKey.includes(h.normalized)
    );
    const match = exact ?? partial;
    mapping[field.key] = match ? match.original : null;
  }

  return mapping;
}
