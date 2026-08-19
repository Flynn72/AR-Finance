import Dexie, { type Table } from "dexie";
import type {
  Customer,
  Invoice,
  Payment,
  CollectionActivity,
  Dispute,
} from "../types";

/**
 * Lapisan persistence lokal (browser). Aplikasi ini internal tool tanpa
 * backend/auth — satu-satunya jalur data masuk adalah Excel/CSV import
 * (lihat PRD section 14-15). IndexedDB dipakai supaya hasil import,
 * pembayaran, dan aktivitas collection yang dicatat user tetap ada
 * setelah reload/browser ditutup, tanpa perlu server.
 */
export class ARDatabase extends Dexie {
  customers!: Table<Customer, string>;
  invoices!: Table<Invoice, string>;
  payments!: Table<Payment, string>;
  activities!: Table<CollectionActivity, string>;
  disputes!: Table<Dispute, string>;

  constructor() {
    super("ar_dashboard_db");
    this.version(1).stores({
      customers: "customer_code, customer_name, risk_level, status",
      invoices: "invoice_number, customer_code, due_date, invoice_date",
      payments: "payment_id, invoice_number, customer_code, payment_date",
      activities:
        "activity_id, customer_code, invoice_number, activity_date, is_ptp",
      disputes: "dispute_id, invoice_number, customer_code, status",
    });
  }
}

export const db = new ARDatabase();
