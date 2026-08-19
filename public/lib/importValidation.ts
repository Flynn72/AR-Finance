import type { ImportFieldTemplate, ImportDataType } from "./importTemplates";
import type { Customer, Invoice, CollectionActivity } from "../types";

export type ColumnMapping = Record<string, string | null>; // fieldKey -> file header (atau null jika tidak dipetakan)

export interface RowValidationResult {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  isDuplicate: boolean;
}

export interface ValidationSummary {
  validRows: RowValidationResult[];
  invalidRows: RowValidationResult[];
  duplicateCount: number;
}

function parseBoolean(value: string): boolean {
  const v = value.trim().toLowerCase();
  return ["true", "1", "ya", "yes", "y"].includes(v);
}

function parseDateValue(value: string): string | null {
  if (!value) return null;
  // Coba format umum: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (isoMatch) return value;

  const dmy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function validateField(
  field: ImportFieldTemplate,
  rawValue: string
): { value: string; error: string | null } {
  const value = rawValue?.trim() ?? "";

  if (!value) {
    if (field.required) return { value: "", error: `${field.label} wajib diisi` };
    return { value: field.defaultValue ?? "", error: null };
  }

  switch (field.type) {
    case "number": {
      const num = Number(value.replace(/[.,](?=\d{3})/g, "").replace(",", "."));
      if (isNaN(num)) return { value, error: `${field.label} harus berupa angka` };
      return { value: String(num), error: null };
    }
    case "date": {
      const parsed = parseDateValue(value);
      if (!parsed) return { value, error: `${field.label} bukan format tanggal yang valid` };
      return { value: parsed, error: null };
    }
    case "boolean":
      return { value: String(parseBoolean(value)), error: null };
    case "enum":
      if (field.enumValues && !field.enumValues.includes(value)) {
        return {
          value,
          error: `${field.label} harus salah satu dari: ${field.enumValues.join(", ")}`,
        };
      }
      return { value, error: null };
    default:
      return { value, error: null };
  }
}

function mapRow(
  raw: Record<string, string>,
  mapping: ColumnMapping,
  template: ImportFieldTemplate[]
): { data: Record<string, string>; errors: string[] } {
  const data: Record<string, string> = {};
  const errors: string[] = [];

  for (const field of template) {
    const header = mapping[field.key];
    const rawValue = header ? raw[header] ?? "" : "";
    const { value, error } = validateField(field, rawValue);
    if (error) errors.push(error);
    data[field.key] = value;
  }

  return { data, errors };
}

interface ValidationContext {
  existingCustomerCodes: Set<string>;
  existingInvoiceNumbers: Set<string>;
}

export function validateRows(
  dataType: ImportDataType,
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  template: ImportFieldTemplate[],
  context: ValidationContext
): ValidationSummary {
  const validRows: RowValidationResult[] = [];
  const invalidRows: RowValidationResult[] = [];
  const seenInBatch = new Set<string>();
  let duplicateCount = 0;

  rawRows.forEach((raw, idx) => {
    const { data, errors } = mapRow(raw, mapping, template);

    // Validasi referensial: customer_code & invoice_number harus sudah ada
    // (untuk import Invoices/Activity yang mereferensikan data lain)
    if (dataType !== "customers" && data.customer_code) {
      if (!context.existingCustomerCodes.has(data.customer_code)) {
        errors.push(`Kode customer "${data.customer_code}" tidak ditemukan — import Customer terlebih dahulu`);
      }
    }
    if (dataType === "activities" && data.invoice_number) {
      if (!context.existingInvoiceNumbers.has(data.invoice_number)) {
        errors.push(`Nomor invoice "${data.invoice_number}" tidak ditemukan`);
      }
    }

    const uniqueKey =
      dataType === "customers"
        ? data.customer_code
        : dataType === "invoices"
        ? data.invoice_number
        : `${data.invoice_number}-${idx}`;

    let isDuplicate = false;
    if (dataType !== "activities") {
      const existingSet =
        dataType === "customers" ? context.existingCustomerCodes : context.existingInvoiceNumbers;
      isDuplicate = existingSet.has(uniqueKey) || seenInBatch.has(uniqueKey);
      if (uniqueKey) seenInBatch.add(uniqueKey);
      if (isDuplicate) duplicateCount++;
    }

    const result: RowValidationResult = { rowIndex: idx, data, errors, isDuplicate };
    if (errors.length > 0) {
      invalidRows.push(result);
    } else {
      validRows.push(result);
    }
  });

  return { validRows, invalidRows, duplicateCount };
}

export function toCustomer(data: Record<string, string>): Customer {
  return {
    customer_code: data.customer_code,
    customer_name: data.customer_name,
    industry: data.industry,
    contact: data.contact || "-",
    credit_limit: Number(data.credit_limit) || 0,
    risk_level: (data.risk_level as Customer["risk_level"]) || "Low",
    status: (data.status as Customer["status"]) || "Active",
  };
}

export function toInvoice(data: Record<string, string>): Invoice {
  return {
    invoice_number: data.invoice_number,
    customer_code: data.customer_code,
    invoice_date: data.invoice_date,
    due_date: data.due_date,
    amount: Number(data.amount) || 0,
    paid_amount: Number(data.paid_amount) || 0,
    collector: data.collector || "-",
    is_escalated: data.is_escalated === "true",
  };
}

export function toActivity(data: Record<string, string>, idx: number): CollectionActivity {
  return {
    activity_id: `ACT-IMPORT-${Date.now()}-${idx}`,
    customer_code: data.customer_code,
    invoice_number: data.invoice_number,
    activity_type: data.activity_type as CollectionActivity["activity_type"],
    activity_date: data.activity_date,
    notes: data.notes,
    collector: data.collector || "-",
    next_follow_up: data.next_follow_up || undefined,
    is_ptp: data.is_ptp === "true",
    promise_payment_date: data.promise_payment_date || undefined,
    promise_amount: data.promise_amount ? Number(data.promise_amount) : undefined,
  };
}
