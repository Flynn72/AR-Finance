import type { AgingBucket, Customer, Dispute, InvoiceComputed, Payment } from "../types";

/**
 * Semua fungsi di sini murni derive dari data store (invoices/payments/disputes)
 * — tidak ada angka hardcode — sesuai DATA FLOW yang sudah disepakati:
 * Import -> Invoice -> Payment -> Dashboard.
 */

const BUCKET_ORDER: AgingBucket[] = ["Current", "1-30", "31-60", "61-90", ">90"];

export interface AgingChartPoint {
  bucket: AgingBucket;
  label: string;
  amount: number;
}

export function getAgingDistribution(invoices: InvoiceComputed[]): AgingChartPoint[] {
  const labels: Record<AgingBucket, string> = {
    Current: "Current",
    "1-30": "1-30 Hari",
    "31-60": "31-60 Hari",
    "61-90": "61-90 Hari",
    ">90": ">90 Hari",
  };

  const totals = new Map<AgingBucket, number>(BUCKET_ORDER.map((b) => [b, 0]));
  for (const inv of invoices) {
    if (inv.outstanding <= 0) continue;
    totals.set(inv.aging_bucket, (totals.get(inv.aging_bucket) ?? 0) + inv.outstanding);
  }

  return BUCKET_ORDER.map((bucket) => ({
    bucket,
    label: labels[bucket],
    amount: totals.get(bucket) ?? 0,
  }));
}

export interface CashInflowPoint {
  key: string; // "2026-03"
  label: string; // "Mar"
  amount: number;
}

const MONTH_LABEL = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Total pembayaran masuk per bulan, N bulan terakhir termasuk bulan berjalan. */
export function getCashInflowTrend(payments: Payment[], monthsBack = 6): CashInflowPoint[] {
  const now = new Date();
  const points: CashInflowPoint[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    points.push({ key, label: MONTH_LABEL[d.getMonth()], amount: 0 });
  }

  const byKey = new Map(points.map((p) => [p.key, p]));
  for (const p of payments) {
    const d = new Date(p.payment_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const point = byKey.get(key);
    if (point) point.amount += p.payment_amount;
  }

  return points;
}

export interface OverdueRow {
  invoice: InvoiceComputed;
  customer: Customer | undefined;
}

/** Invoice overdue/escalated dengan outstanding terbesar, diutamakan yang sudah dieskalasi/paling lama. */
export function getHighPriorityOverdue(
  invoices: InvoiceComputed[],
  customers: Customer[],
  limit = 5
): OverdueRow[] {
  const customerMap = new Map(customers.map((c) => [c.customer_code, c]));

  return invoices
    .filter((inv) => inv.status === "Overdue" || inv.status === "Escalated")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "Escalated" ? -1 : 1;
      return b.outstanding - a.outstanding;
    })
    .slice(0, limit)
    .map((invoice) => ({ invoice, customer: customerMap.get(invoice.customer_code) }));
}

export interface DisputeSummary {
  totalDisputedAmount: number;
  openCount: number;
  urgentCount: number; // dispute Open/Under Review yang sudah > 14 hari
}

export function getDisputeSummary(disputes: Dispute[]): DisputeSummary {
  const ACTIVE: Dispute["status"][] = ["Open", "Under Review", "Waiting Customer"];
  const active = disputes.filter((d) => ACTIVE.includes(d.status));
  const totalDisputedAmount = active.reduce((sum, d) => sum + d.amount, 0);

  const now = new Date();
  const urgentCount = active.filter((d) => {
    const days = Math.round(
      (now.getTime() - new Date(d.created_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 14;
  }).length;

  return { totalDisputedAmount, openCount: active.length, urgentCount };
}
