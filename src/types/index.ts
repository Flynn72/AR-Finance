// ============================================================
// Accounts Receivable Dashboard — Core Domain Types
// Sesuai PRD section 19 (Data Model) & section 20 (Relationships)
// ============================================================

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type CustomerStatus = "Active" | "Inactive";

export interface Customer {
  customer_code: string; // PK
  customer_name: string;
  industry: string;
  contact: string;
  credit_limit: number;
  risk_level: RiskLevel;
  status: CustomerStatus;
}

// Status dasar yang DIHITUNG dari data (bukan disimpan manual),
// kecuali "Escalated" yang merupakan flag manual (lihat lib/calculations.ts)
export type InvoiceStatus =
  | "Paid"
  | "Unpaid"
  | "Overdue"
  | "Disputed"
  | "Escalated";

export type AgingBucket = "Current" | "1-30" | "31-60" | "61-90" | ">90";

export type PaymentMethod =
  | "Transfer Bank"
  | "Giro"
  | "Cek"
  | "Tunai"
  | "Lainnya";

export interface Invoice {
  invoice_number: string; // PK
  customer_code: string; // FK -> Customer
  invoice_date: string; // ISO date
  due_date: string; // ISO date
  amount: number;
  paid_amount: number;
  collector: string;
  is_escalated: boolean; // manual flag, lihat POTENTIAL ISSUES #3 di analisis awal
}

export interface Payment {
  payment_id: string; // PK
  invoice_number: string; // FK -> Invoice
  customer_code: string;
  payment_date: string; // ISO date
  payment_amount: number;
  payment_method: PaymentMethod;
  reference_number: string;
  notes?: string;
}

export type ActivityType =
  | "Telepon"
  | "Email"
  | "WhatsApp"
  | "Meeting"
  | "Follow Up"
  | "Payment Reminder";

export interface CollectionActivity {
  activity_id: string; // PK
  customer_code: string;
  invoice_number: string;
  activity_type: ActivityType;
  activity_date: string; // ISO date
  notes: string;
  collector: string;
  next_follow_up?: string; // ISO date
  is_ptp: boolean;
  promise_payment_date?: string;
  promise_amount?: number;
}

export type DisputeStatus =
  | "Open"
  | "Under Review"
  | "Waiting Customer"
  | "Resolved"
  | "Rejected";

export interface Dispute {
  dispute_id: string; // PK
  invoice_number: string; // FK -> Invoice
  customer_code: string;
  dispute_reason: string;
  amount: number;
  created_date: string; // ISO date
  status: DisputeStatus;
  assigned_to: string;
}

// ============================================================
// Derived / computed shapes (tidak disimpan, dihitung on-the-fly)
// ============================================================

export interface InvoiceComputed extends Invoice {
  outstanding: number;
  aging_days: number;
  aging_bucket: AgingBucket;
  payment_percentage: number;
  status: InvoiceStatus;
  has_active_dispute: boolean;
}

export interface CustomerFinancialSummary {
  customer_code: string;
  total_invoice: number;
  outstanding: number;
  paid: number;
  overdue: number;
  credit_utilization: number; // outstanding / credit_limit, dalam persen
}
