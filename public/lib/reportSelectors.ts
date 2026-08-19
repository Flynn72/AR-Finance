import type { Customer, InvoiceComputed, Payment } from "../types";
import { computeCollectionRate } from "./calculations";
import { getAgingDistribution, getCashInflowTrend, type AgingChartPoint } from "./dashboardSelectors";

export interface AgingScheduleRow extends AgingChartPoint {
  count: number;
  percentage: number;
}

/** Aging schedule dengan jumlah invoice & persentase — untuk tabel detail Reports. */
export function getAgingSchedule(invoices: InvoiceComputed[]): AgingScheduleRow[] {
  const distribution = getAgingDistribution(invoices);
  const total = distribution.reduce((s, d) => s + d.amount, 0);

  const counts = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.outstanding <= 0) continue;
    counts.set(inv.aging_bucket, (counts.get(inv.aging_bucket) ?? 0) + 1);
  }

  return distribution.map((d) => ({
    ...d,
    count: counts.get(d.bucket) ?? 0,
    percentage: total > 0 ? (d.amount / total) * 100 : 0,
  }));
}

export interface MonthlyCollectionRow {
  label: string;
  billed: number;
  collected: number;
  collectionRate: number;
}

/** Tren bulanan: total ditagihkan (invoice_date jatuh di bulan itu) vs total tertagih (payment_date). */
export function getMonthlyCollectionReport(
  invoices: InvoiceComputed[],
  payments: Payment[],
  monthsBack = 6
): MonthlyCollectionRow[] {
  const cashInflow = getCashInflowTrend(payments, monthsBack);

  const billedByKey = new Map<string, number>();
  for (const inv of invoices) {
    const d = new Date(inv.invoice_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    billedByKey.set(key, (billedByKey.get(key) ?? 0) + inv.amount);
  }

  return cashInflow.map((point) => {
    const billed = billedByKey.get(point.key) ?? 0;
    return {
      label: point.label,
      billed,
      collected: point.amount,
      collectionRate: billed > 0 ? (point.amount / billed) * 100 : 0,
    };
  });
}

export interface IndustryOverdueRow {
  industry: string;
  totalExposure: number;
  overdue90Plus: number;
}

export function getOverdueByIndustry(
  customers: Customer[],
  invoices: InvoiceComputed[]
): IndustryOverdueRow[] {
  const customerIndustry = new Map(customers.map((c) => [c.customer_code, c.industry]));
  const totals = new Map<string, { exposure: number; over90: number }>();

  for (const inv of invoices) {
    if (inv.outstanding <= 0) continue;
    const industry = customerIndustry.get(inv.customer_code) ?? "Lainnya";
    const entry = totals.get(industry) ?? { exposure: 0, over90: 0 };
    entry.exposure += inv.outstanding;
    if (inv.aging_bucket === ">90") entry.over90 += inv.outstanding;
    totals.set(industry, entry);
  }

  return Array.from(totals.entries())
    .map(([industry, v]) => ({ industry, totalExposure: v.exposure, overdue90Plus: v.over90 }))
    .sort((a, b) => b.totalExposure - a.totalExposure);
}

export interface CustomerExposureRow {
  customer: Customer;
  totalExposure: number;
  overdue90Plus: number;
  status: "Escalated" | "PTP Broken" | "Disputed" | "Normal";
}

/** Top customer berdasarkan exposure — untuk drilldown risiko tinggi. */
export function getCustomerExposureReport(
  customers: Customer[],
  invoices: InvoiceComputed[],
  limit = 10
): CustomerExposureRow[] {
  const customerMap = new Map(customers.map((c) => [c.customer_code, c]));
  const totals = new Map<string, { exposure: number; over90: number; hasEscalated: boolean; hasDisputed: boolean }>();

  for (const inv of invoices) {
    if (inv.outstanding <= 0) continue;
    const entry = totals.get(inv.customer_code) ?? {
      exposure: 0,
      over90: 0,
      hasEscalated: false,
      hasDisputed: false,
    };
    entry.exposure += inv.outstanding;
    if (inv.aging_bucket === ">90") entry.over90 += inv.outstanding;
    if (inv.status === "Escalated") entry.hasEscalated = true;
    if (inv.status === "Disputed") entry.hasDisputed = true;
    totals.set(inv.customer_code, entry);
  }

  return Array.from(totals.entries())
    .map((entry): CustomerExposureRow | null => {
      const [code, v] = entry;
      const customer = customerMap.get(code);
      if (!customer) return null;
      const status: CustomerExposureRow["status"] = v.hasEscalated
        ? "Escalated"
        : v.hasDisputed
        ? "Disputed"
        : "Normal";
      return {
        customer,
        totalExposure: v.exposure,
        overdue90Plus: v.over90,
        status,
      };
    })
    .filter((r): r is CustomerExposureRow => r !== null)
    .sort((a, b) => b.totalExposure - a.totalExposure)
    .slice(0, limit);
}

export function getCollectionEfficiency(invoices: InvoiceComputed[]): number {
  return computeCollectionRate(invoices);
}
