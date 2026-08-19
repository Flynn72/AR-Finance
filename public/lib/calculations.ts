import type {
  AgingBucket,
  Customer,
  CustomerFinancialSummary,
  Dispute,
  Invoice,
  InvoiceComputed,
  InvoiceStatus,
} from "../types";

/**
 * Semua field turunan invoice (status, outstanding, aging, dsb) dihitung
 * di sini — bukan disimpan di store — sesuai PRD section 16 & aturan #12
 * ("Status invoice harus dapat dihitung berdasarkan data").
 */

const DAY_MS = 1000 * 60 * 60 * 24;

export function daysBetween(from: string | Date, to: string | Date): number {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export function getOutstanding(invoice: Invoice): number {
  return Math.max(invoice.amount - invoice.paid_amount, 0);
}

export function getPaymentPercentage(invoice: Invoice): number {
  if (invoice.amount <= 0) return 0;
  return Math.min((invoice.paid_amount / invoice.amount) * 100, 100);
}

/** Aging = jumlah hari sejak due_date terlewati. 0 atau negatif berarti belum jatuh tempo. */
export function getAgingDays(invoice: Invoice, today: Date = new Date()): number {
  const overdueDays = daysBetween(invoice.due_date, today);
  return Math.max(overdueDays, 0);
}

export function getAgingBucket(agingDays: number): AgingBucket {
  if (agingDays <= 0) return "Current";
  if (agingDays <= 30) return "1-30";
  if (agingDays <= 60) return "31-60";
  if (agingDays <= 90) return "61-90";
  return ">90";
}

/**
 * Status logic (PRD 16.1):
 * - paid_amount >= amount              -> Paid
 * - belum paid, ada dispute aktif      -> Disputed
 * - belum paid, is_escalated=true      -> Escalated
 * - belum paid, TODAY() > due_date     -> Overdue
 * - belum paid, belum lewat due date   -> Unpaid
 */
export function getInvoiceStatus(
  invoice: Invoice,
  hasActiveDispute: boolean,
  today: Date = new Date()
): InvoiceStatus {
  const outstanding = getOutstanding(invoice);
  if (outstanding <= 0) return "Paid";
  if (hasActiveDispute) return "Disputed";
  if (invoice.is_escalated) return "Escalated";
  if (daysBetween(invoice.due_date, today) > 0) return "Overdue";
  return "Unpaid";
}

const ACTIVE_DISPUTE_STATUSES: Dispute["status"][] = [
  "Open",
  "Under Review",
  "Waiting Customer",
];

export function computeInvoice(
  invoice: Invoice,
  disputes: Dispute[],
  today: Date = new Date()
): InvoiceComputed {
  const hasActiveDispute = disputes.some(
    (d) =>
      d.invoice_number === invoice.invoice_number &&
      ACTIVE_DISPUTE_STATUSES.includes(d.status)
  );
  const outstanding = getOutstanding(invoice);
  const aging_days = getAgingDays(invoice, today);

  return {
    ...invoice,
    outstanding,
    aging_days,
    aging_bucket: getAgingBucket(aging_days),
    payment_percentage: getPaymentPercentage(invoice),
    status: getInvoiceStatus(invoice, hasActiveDispute, today),
    has_active_dispute: hasActiveDispute,
  };
}

export function computeCustomerSummary(
  customer: Customer,
  invoices: InvoiceComputed[]
): CustomerFinancialSummary {
  const customerInvoices = invoices.filter(
    (inv) => inv.customer_code === customer.customer_code
  );

  const total_invoice = customerInvoices.reduce((sum, i) => sum + i.amount, 0);
  const paid = customerInvoices.reduce((sum, i) => sum + i.paid_amount, 0);
  const outstanding = customerInvoices.reduce((sum, i) => sum + i.outstanding, 0);
  const overdue = customerInvoices
    .filter((i) => i.status === "Overdue" || i.status === "Escalated")
    .reduce((sum, i) => sum + i.outstanding, 0);

  const credit_utilization =
    customer.credit_limit > 0 ? (outstanding / customer.credit_limit) * 100 : 0;

  return {
    customer_code: customer.customer_code,
    total_invoice,
    outstanding,
    paid,
    overdue,
    credit_utilization,
  };
}

/** Days Sales Outstanding sederhana: (Total Outstanding / Total Invoiced) * jumlah hari periode */
export function computeDSO(
  invoices: InvoiceComputed[],
  periodDays = 90
): number {
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.outstanding, 0);
  if (totalInvoiced <= 0) return 0;
  return Math.round((totalOutstanding / totalInvoiced) * periodDays);
}

export function computeCollectionRate(invoices: InvoiceComputed[]): number {
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paid_amount, 0);
  if (totalInvoiced <= 0) return 0;
  return (totalPaid / totalInvoiced) * 100;
}

/**
 * Kategorisasi risk level dari credit utilization. Dipakai saat data
 * customer pertama kali dibuat (mock generator maupun Import Wizard) —
 * bukan computed live seperti status/aging invoice, karena risk_level
 * adalah field yang memang disimpan di entity Customer (PRD section 19).
 */
export function getRiskLevel(utilizationPercent: number): Customer["risk_level"] {
  if (utilizationPercent >= 100) return "Critical";
  if (utilizationPercent >= 75) return "High";
  if (utilizationPercent >= 40) return "Medium";
  return "Low";
}
