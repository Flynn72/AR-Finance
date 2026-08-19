import type {
  Customer,
  Invoice,
  Payment,
  CollectionActivity,
  Dispute,
} from "../types";
import { getRiskLevel } from "./calculations";

/**
 * Mock data generator — satu sumber data yang konsisten untuk seluruh
 * aplikasi (PRD section 26). Dipanggil sekali saat database Supabase kosong
 * (lihat store/useARStore.ts -> seedIfEmpty).
 */

// Seeded PRNG supaya data konsisten antar reload sebelum ada import nyata
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260816);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;

const COMPANY_PREFIXES = [
  "Sumber", "Mitra", "Cipta", "Karya", "Sejahtera", "Utama", "Nusantara",
  "Maju", "Bina", "Sinar", "Prima", "Anugerah", "Global", "Berkah",
  "Mandiri", "Sejati", "Abadi", "Perkasa", "Jaya", "Harmoni",
];
const COMPANY_SUFFIXES = [
  "Logistik", "Teknindo", "Perkasa", "Industri", "Distribusi", "Trading",
  "Manufaktur", "Elektronika", "Agro", "Konstruksi", "Chemical", "Plastik",
  "Textile", "Packaging", "Solusi", "Digital",
];
const LEGAL_FORMS = ["PT", "PT", "PT", "CV"];

const INDUSTRIES = [
  "Manufaktur", "Retail", "Logistik & Distribusi", "Konstruksi",
  "Teknologi", "F&B", "Tekstil", "Otomotif", "Kimia & Farmasi", "Agrikultur",
];

const COLLECTORS = ["Budi Santoso", "Rina Wijaya", "Ahmad Fauzi", "Dewi Lestari"];

const DISPUTE_REASONS = [
  "Selisih Harga", "Barang Rusak", "PO Tidak Sesuai", "Kekurangan Kuantitas",
  "Invoice Duplikat", "Diskon Belum Diterapkan",
];

function makeCustomerName(): string {
  return `${pick(LEGAL_FORMS)} ${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)}`;
}

function isoDaysFromToday(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function generateMockData(customerCount = 25, invoiceCount = 130) {
  const customers: Customer[] = [];
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const activities: CollectionActivity[] = [];
  const disputes: Dispute[] = [];

  const usedNames = new Set<string>();

  for (let i = 0; i < customerCount; i++) {
    let name = makeCustomerName();
    while (usedNames.has(name)) name = makeCustomerName();
    usedNames.add(name);

    const customer_code = `CUST-${String(1000 + i)}`;
    const credit_limit = randInt(50, 800) * 1_000_000;

    customers.push({
      customer_code,
      customer_name: name,
      industry: pick(INDUSTRIES),
      contact: `finance@${name.split(" ").pop()?.toLowerCase()}.co.id`,
      credit_limit,
      risk_level: "Low", // di-recompute di bawah setelah invoice dibuat
      status: rand() > 0.06 ? "Active" : "Inactive",
    });
  }

  // Distribusi invoice per bucket agar representatif (PRD section 26)
  const bucketPlan: Array<{ dueOffset: [number, number]; weight: number }> = [
    { dueOffset: [1, 45], weight: 0.28 }, // Current (belum jatuh tempo)
    { dueOffset: [-30, -1], weight: 0.22 }, // 1-30 hari overdue
    { dueOffset: [-60, -31], weight: 0.18 }, // 31-60
    { dueOffset: [-90, -61], weight: 0.14 }, // 61-90
    { dueOffset: [-160, -91], weight: 0.18 }, // >90
  ];

  function pickDueOffset(): number {
    const r = rand();
    let acc = 0;
    for (const b of bucketPlan) {
      acc += b.weight;
      if (r <= acc) return randInt(b.dueOffset[0], b.dueOffset[1]);
    }
    return randInt(-10, 10);
  }

  let paymentCounter = 1;
  let activityCounter = 1;
  let disputeCounter = 1;

  for (let i = 0; i < invoiceCount; i++) {
    const customer = pick(customers);
    const invoice_number = `INV-2026-${String(1000 + i)}`;
    const dueOffset = pickDueOffset();
    const invoiceLeadDays = randInt(14, 45); // termin pembayaran
    const due_date = isoDaysFromToday(dueOffset);
    const invoice_date = isoDaysFromToday(dueOffset - invoiceLeadDays);
    const amount = randInt(5, 250) * 1_000_000;

    // Tentukan status "niat" untuk realisme, lalu turunkan paid_amount
    const isPastDue = dueOffset < 0;
    const roll = rand();
    let paid_amount = 0;
    let is_escalated = false;

    if (!isPastDue) {
      // Current: sebagian sudah dicicil sebagian
      paid_amount = roll < 0.15 ? amount : roll < 0.3 ? Math.round(amount * rand()) : 0;
    } else {
      const daysOverdue = -dueOffset;
      if (roll < 0.32) {
        paid_amount = amount; // sudah lunas
      } else if (roll < 0.42) {
        paid_amount = Math.round(amount * (0.2 + rand() * 0.5)); // cicilan sebagian
      } else {
        paid_amount = 0;
      }
      if (daysOverdue > 90 && paid_amount < amount && rand() < 0.35) {
        is_escalated = true;
      }
    }

    invoices.push({
      invoice_number,
      customer_code: customer.customer_code,
      invoice_date,
      due_date,
      amount,
      paid_amount,
      collector: pick(COLLECTORS),
      is_escalated,
    });

    // Payment record kalau ada paid_amount
    if (paid_amount > 0) {
      payments.push({
        payment_id: `PAY-${String(paymentCounter++).padStart(5, "0")}`,
        invoice_number,
        customer_code: customer.customer_code,
        payment_date: isoDaysFromToday(dueOffset - randInt(0, 10)),
        payment_amount: paid_amount,
        payment_method: pick([
          "Transfer Bank",
          "Transfer Bank",
          "Giro",
          "Cek",
          "Tunai",
        ]),
        reference_number: `REF${randInt(100000, 999999)}`,
      });
    }

    // Collection activity untuk sebagian invoice overdue/current yang berisiko
    if ((isPastDue || rand() < 0.15) && paid_amount < amount && rand() < 0.6) {
      const isPtp = rand() < 0.3;
      activities.push({
        activity_id: `ACT-${String(activityCounter++).padStart(5, "0")}`,
        customer_code: customer.customer_code,
        invoice_number,
        activity_type: pick([
          "Telepon", "Email", "WhatsApp", "Follow Up", "Payment Reminder", "Meeting",
        ]),
        activity_date: isoDaysFromToday(randInt(-20, -1)),
        notes: isPtp
          ? "Customer berjanji akan melakukan pembayaran sesuai tanggal yang disepakati."
          : "Sudah dihubungi, menunggu konfirmasi jadwal pembayaran.",
        collector: pick(COLLECTORS),
        next_follow_up: isoDaysFromToday(randInt(1, 14)),
        is_ptp: isPtp,
        promise_payment_date: isPtp ? isoDaysFromToday(randInt(3, 21)) : undefined,
        promise_amount: isPtp ? amount - paid_amount : undefined,
      });
    }

    // Dispute untuk sebagian kecil invoice yang belum lunas
    if (paid_amount < amount && rand() < 0.08) {
      disputes.push({
        dispute_id: `DSP-${String(disputeCounter++).padStart(4, "0")}`,
        invoice_number,
        customer_code: customer.customer_code,
        dispute_reason: pick(DISPUTE_REASONS),
        amount: amount - paid_amount,
        created_date: isoDaysFromToday(randInt(-25, -2)),
        status: pick([
          "Open", "Under Review", "Waiting Customer", "Resolved", "Rejected",
        ]),
        assigned_to: pick(COLLECTORS),
      });
    }
  }

  // Recompute risk_level tiap customer berdasarkan credit utilization aktual
  for (const c of customers) {
    const custInvoices = invoices.filter((i) => i.customer_code === c.customer_code);
    const outstanding = custInvoices.reduce(
      (sum, i) => sum + Math.max(i.amount - i.paid_amount, 0),
      0
    );
    const utilization = c.credit_limit > 0 ? (outstanding / c.credit_limit) * 100 : 0;
    c.risk_level = getRiskLevel(utilization);
  }

  return { customers, invoices, payments, activities, disputes };
}
